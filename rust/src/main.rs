#![feature(decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;

use rocket::Rocket;
use rocket_contrib::serve::StaticFiles;

mod graph;

fn rocket() -> Rocket {
    graph::rocket(rocket::ignite())
        .mount("/", StaticFiles::from("static/"))
}

fn main() {
    rocket().launch();
}
