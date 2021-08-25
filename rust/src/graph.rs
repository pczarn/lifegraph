use std::borrow::Cow;
use std::collections::BTreeMap;
use std::sync::Mutex;
use std::mem;

use rocket::State;
use rocket::Rocket;
use rocket_contrib::json::{Json, JsonValue, json};

use serde::{Serialize, Deserialize};

// The type to represent the ID of a message.
type Id = usize;

// We're going to store all of the messages here. No need for a DB.
type GraphMutex = Mutex<Graph>;
type GraphState = State<GraphMutex>;

struct Graph {
    nodes: BTreeMap<Id, Node>,
    labels: BTreeMap<(Id, Id), String>,
}

struct Node {
    label: String,
    adjacent: Vec<Id>,
}

#[derive(Serialize, Deserialize)]
struct NodeMessage {
    id: Option<Id>,
    label: String,
    adjacent: Vec<(Id, Option<String>)>,
}

#[post("/<id>", format = "json", data = "<message>")]
fn new(id: Id, message: Json<NodeMessage>, map: GraphState) -> JsonValue {
    let mut graph = map.lock().expect("map lock.");
    if graph.nodes.contains_key(&id) {
        json!({
            "status": "error",
            "reason": "ID exists. Try put."
        })
    } else {
        graph.nodes.insert(id, Node {
            label: message.0.label,
            adjacent: message.0.adjacent.iter().map(|&(arc_to, _label)| arc_to).collect(),
        });
        for (mut arc_to, edge_label) in message.0.adjacent.iter().filter_map(|&(arc_to, ref opt_label)| opt_label.as_ref().map(|label| (arc_to, label))) {
            let mut arc_from = id;
            if arc_from < arc_to {
                mem::swap(&mut arc_from, &mut arc_to);
            } 
            graph.labels.insert((arc_from, arc_to), edge_label.clone());
        }
        json!({ "status": "ok" })
    }
}

#[put("/<id>", format = "json", data = "<message>")]
fn update(id: ID, message: Json<NodeMessage>, map: GraphState) -> Option<JsonValue> {
    let mut graph = map.lock().unwrap();
    if graph.nodes.contains_key(&id) {
        hashmap.insert(id, message.0.contents);
        Some(json!({ "status": "ok" }))
    } else {
        None
    }
}

#[get("/<id>", format = "json")]
fn get(id: ID, map: GraphState) -> Option<Json<NodeMessage>> {
    let graph = map.lock().unwrap();
    hashmap.get(&id).map(|contents| {
        Json(Message {
            id: Some(id),
            contents: contents.clone()
        })
    })
}

#[catch(404)]
fn not_found() -> JsonValue {
    json!({
        "status": "error",
        "reason": "Resource was not found."
    })
}

pub fn rocket(rocket: Rocket) -> Rocket {
    rocket.mount("/nodes", routes![new, update, get])
        .register("/nodes", catchers![not_found])
        .manage(MessageList::new(vec![]))
}
