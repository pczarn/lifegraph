'use strict';

var dotSrc = 'graph { a -- b }';

var graphviz;
var app = Vue.new();

function startApp() {
}

function render() {
  graphviz
    .renderDot(dotSrc, startApp);
}
window.onload = function () {
  graphviz = d3.select("#graph").graphviz();
  graphviz
    .attributer(attributer)
    .transition(function () {
      return d3.transition().duration(1000);
    });

  render();
}

function attributer(datum, index, nodes) {
  var selection = d3.select(this);
  if (datum.tag == "svg") {
    var margin = 10;
    var width = window.innerWidth - margin;
    var height = window.innerHeight - margin;
    var x = "10";
    var y = "10";
    var unit = 'px';
    selection
      .attr("width", width + unit)
      .attr("height", height + unit);
    datum.attributes.width = width + unit;
    datum.attributes.height = height + unit;
  }
}
