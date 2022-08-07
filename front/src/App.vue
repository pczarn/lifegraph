<template>
  <div>
    <img alt="Vue logo" src="./assets/logo.png">
    <div v-if="loading">
      LOADING: {{loading}}
    </div>
    <div v-else-if="error">
      ERROR: {{error}}
    </div>
    <div id="graph" style="text-align: center;"></div>
  </div>
</template>

<script>
import { computed, reactive, ref } from 'vue'
import gql from 'graphql-tag'
import { useQuery } from '@vue/apollo-composable'
import * as d3 from "d3";
import "d3-graphviz";

function attributer(datum, index, nodes) {
  console.log(index);
  console.log(nodes);
  var selection = d3.select(this);
  if (datum.tag == "svg") {
    var margin = 10;
    var width = window.innerWidth - margin;
    var height = window.innerHeight - margin;
    // var x = "10";
    // var y = "10";
    var unit = 'px';
    selection
      .attr("width", width + unit)
      .attr("height", height + unit);
    datum.attributes.width = width + unit;
    datum.attributes.height = height + unit;
  }
}

// const NODES_QUERY = gql`
//   query AllNodes {
//     allNodes {
//       id
//       label
//     }
//   }
// `;

const EDGES_QUERY = gql`
  query AllEdges {
    allEdges {
      id
      label
      from {
        label
      }
      to {
        label
      }
    }
  }
`;

const NODES_QUERY = gql`
  query AllNodes {
    allNodes {
      id
      label
    }
  }
`;

function getDictionary() {
    return validateDictionary("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

    function validateDictionary(dictionary) {
        for (let i = 0; i < dictionary.length; i++) {
            if(dictionary.indexOf(dictionary[i]) !== dictionary.lastIndexOf(dictionary[i])) {
                console.log('Error: The dictionary in use has at least one repeating symbol:', dictionary[i])
                return undefined
            }
        }
        return dictionary
    }
}

function numberToEncodedLetter(number) {
    //Takes any number and converts it into a base (dictionary length) letter combo. 0 corresponds to an empty string.
    //It converts any numerical entry into a positive integer.
    if (isNaN(number)) {return undefined}
    number = Math.abs(Math.floor(number))

    const dictionary = getDictionary()
    let index = number % dictionary.length
    let quotient = number / dictionary.length
    let result
    
    if (number <= dictionary.length) {return numToLetter(number)}  //Number is within single digit bounds of our encoding letter alphabet

    if (quotient >= 1) {
        //This number was bigger than our dictionary, recursively perform this function until we're done
        if (index === 0) {quotient--}   //Accounts for the edge case of the last letter in the dictionary string
        result = numberToEncodedLetter(quotient)
    }

    if (index === 0) {index = dictionary.length}   //Accounts for the edge case of the final letter; avoids getting an empty string
    
    return result + numToLetter(index)

    function numToLetter(number) {
        //Takes a letter between 0 and max letter length and returns the corresponding letter
        if (number > dictionary.length || number < 0) {return undefined}
        if (number === 0) {
            return ''
        } else {
            return dictionary.slice(number - 1, number)
        }
    }
}

function encodedLetterToNumber(encoded) {
    const dictionary = getDictionary()
    if (encoded.length === 0) {
      return 0;
    }
    const num = dictionary.indexOf(encoded.substring(0, 1))
    return num + dictionary.length * encodedLetterToNumber(encoded.substring(1))
}

export default {
  name: 'App',
  mounted () {
    console.log('create');
    let script = document.createElement('script');
    script.setAttribute('src', 'https://unpkg.com/@hpcc-js/wasm@1.12.8/dist/index.min.js');
    script.setAttribute('type', 'javascript/worker');
    document.head.appendChild(script);
    window.addEventListener("load", this.onWindowLoad);
    window.addEventListener("keydown", this.keydown);
  },
  // data () {
  //   return {
  //     edges: { result: null },
  //     nodes: { result: null },
  //     loading: null,
  //     error: null,
  //   }
  // },
  setup () {
    const { result: edgesResult, loading: edgesLoading, error: edgesError } = useQuery(EDGES_QUERY);
    const { result: nodesResult, loading: nodesLoading, error: nodesError } = useQuery(NODES_QUERY);
    const edges = computed(() => edgesResult.value?.allEdges ?? []);
    const nodes = computed(() => nodesResult.value?.allNodes ?? []);
    return {
      edges,
      edgesLoading,
      edgesError,
      nodes,
      nodesLoading,
      nodesError,
      selectedNode: ref(null),
      state: reactive({ kind: "waiting", string: "" }),
    }
  },
  methods: {
    onWindowLoad() {
      console.log('window load');
      this.graphviz = d3.select("#graph").graphviz();
      this.graphviz
        .attributer(attributer)
        .transition(function () {
          return d3.transition().duration(300);
        })
        .on("end", this.interactive);

      console.log('window load')
      this.render();
    },
    keydown(ev) {
      console.log('keydown', ev)
      if (ev.code === "KeyG" && this.state.kind === "waiting") {
        this.state.kind = "input";
      } else if (this.state.kind === "input") {
        if (ev.key >= "a" && ev.key <= "z") {
          this.state.string += ev.key.toUpperCase();
          const numLetters = Math.ceil(Math.log(this.nodes.length) / Math.log(getDictionary().length))
          if (this.state.string.length === numLetters) {
            const nodeId = encodedLetterToNumber(this.state.string)
            this.selectedNode = this.nodes[nodeId]
            this.state.kind = "waiting"
            this.state.string = ""
          } else if (this.state.string.length > numLetters) {
            this.state.kind = "waiting"
            this.state.string = ""
          }
        } else if (ev.code === "Backspace") {
          this.state.string = this.state.string.slice(0, -1)
        }
      }
    },
    render() {
      console.log('render')
      // this.graphviz.renderDot(this.dotDocument);
      // console.log("translateTo", this.graphviz.translateTo, this.graphviz.zoom);
    },
    interactive() {
      d3
          .select("#graph")    //  Or change to #id of your hosting SVG node or svg node
          .selectAll(".node")
          .on("click", (ev) => {
            const node = ev.path.find(elem => { return elem.getAttribute("class") == "node" });
            // clicked node number
            console.log(parseInt(node.getAttribute("id").substring(4)));
          });
      d3.select("#graph").selectAll(".node").append((node) => {
        const nodeIndex = parseInt(node.attributes.id.substring(4)) - 1
        const attrs = node.children[3].attributes
        console.log("a", node.children.length)
        return this.makeNodeLabel(nodeIndex, parseFloat(attrs.cx) - parseFloat(attrs.rx), parseFloat(attrs.cy) - parseFloat(attrs.ry))
      })
    },
    makeNodeLabel(index, x, y) {
      const xmlns = "http://www.w3.org/2000/svg"
      const text = document.createElementNS(xmlns, "text")
      text.setAttributeNS(null, "x", x)
      text.setAttributeNS(null, "y", y + 7)
      text.setAttributeNS(null, "font-size", 10)
      text.innerHTML = numberToEncodedLetter(index + 1)
      return text
    },
    makeNodeLabelBackground(x, y, width, height) {
      const xmlns = "http://www.w3.org/2000/svg"
      const rect = document.createElementNS(xmlns, "rect")
      rect.setAttributeNS(null, "x", x)
      rect.setAttributeNS(null, "y", y + 7)
      rect.setAttributeNS(null, "width", width)
      rect.setAttributeNS(null, "height", height)
      return rect
    }
  },
  computed: {
    nodesWithState() {
      return this.nodes.map((node, index) => {
        const isSelected = this.selectedNode == node.id
        if (this.state.kind == "input") {
          const shorthand = numberToEncodedLetter(index + 1)
          let shorthandText = null
          let highlightedText = null
          if (shorthand.startsWith(this.state.string)) {
            shorthandText = shorthand.substring(this.state.string.length)
            if (this.state.string.length > 0) {
              highlightedText = this.state.string
            }
          }
          return {
            label: node.label,
            isInput: true,
            isSelected,
            shorthandText,
            highlightedText,
          }
        } else {
          return {
            label: node.label,
            isInput: false,
            isSelected,
          }
        }
      });
    },
    nodesDot() {
      return this.nodesWithState.map((node) => {
        let xlabel = null
        if (node.isInput && node.shorthandText) {
          if (node.highlightedText) {
            xlabel = `<span class="shorthand"><span class="highlighted">${node.highlightedText}</span>${node.shorthandText}</span>`
          } else {
            xlabel = `<span class="shorthand">${node.shorthandText}</span>`
          }
        }
        let fillcolor = "white"
        if (node.isSelected) {
          fillcolor = "red"
        }
        if (xlabel) {
          return `${node.label} [xlabel=${xlabel} fillcolor="${fillcolor}" style=filled]`
        } else {
          return `${node.label} [fillcolor="${fillcolor}" style=filled]`
        }
      });
    },
    edgesDot() {
      return this.edges.map((edge) => { return `"${edge.from.label}" -- "${edge.to.label}"` })
    },
    dotDocument() {
      const content = this.nodesDot.concat(this.edgesDot).join("; ");
      const doc = `graph { ${content} }`;
      return doc;
    }
  },
  watch: {
    dotDocument() {
      this.render();
    },
    // 'edges.result': {
    //   handler: function() {
    //     console.log("edg");
    //     this.$set('edges.result', this.edges.result);
    //   },
    //   deep: true
    // },
    // 'nodes.result': {
    //   handler: function() {
    //     console.log("nodes");
    //     this.$set('nodes.result', this.nodes.result);
    //   },
    //   deep: true
    // },
    // 'loading': {
    //   handler: function() {
    //     this.$set('loading', this.loading);
    //   },
    //   deep: true
    // }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.shorthand {
  background-color: yellow;
}

.shorthand .highlighted {
  color: red;
}
</style>
