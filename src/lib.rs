#[macro_use]
extern crate arrayref;
extern crate bytes;
#[macro_use]
extern crate capnp;
#[macro_use]
extern crate capnp_rpc;
extern crate chrono;
#[macro_use]
extern crate error_chain;
extern crate fs_extra;
extern crate futures;
extern crate hyper;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate log;
extern crate memmap;
extern crate nix;
extern crate rusqlite;
extern crate serde;
extern crate serde_bytes;
extern crate serde_cbor;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate sys_info;
extern crate sysconf;
extern crate tar;
extern crate tempdir;
extern crate tokio_core;
extern crate tokio_io;
extern crate tokio_process;
extern crate tokio_timer;
extern crate tokio_uds;
extern crate walkdir;

pub mod common;
pub mod governor;
pub mod server;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const GOVERNOR_PROTOCOL_VERSION: i32 = 0;
pub const CLIENT_PROTOCOL_VERSION: i32 = 0;
pub const EXECUTOR_PROTOCOL_VERSION: i32 = 0;

use std::sync::atomic::AtomicBool;
lazy_static! {
    // Init debug mode TODO: depend on opts
    pub static ref DEBUG_CHECK_CONSISTENCY: AtomicBool = AtomicBool::new(false);
}

#[allow(unused_doc_comment)]
pub mod errors {
    // Create the Error, ErrorKind, ResultExt, and Result types
    error_chain!{
        types {
            Error, ErrorKind, ResultExt;
        }
        foreign_links {
            Io(::std::io::Error);
            Capnp(::capnp::Error);
            CapnpNotInSchema(::capnp::NotInSchema);
            Timer(::tokio_timer::Error);
            SessionErr(::server::graph::SessionError);
            Utf8Err(::std::str::Utf8Error);
            Json(::serde_json::Error);
            Sqlite(::rusqlite::Error);
        }

        errors {
            Ignored {
                description("Request asked for ignored id")
            }
        }
    }
    // Explicit alias just to make the IDEs happier
    pub type Result<T> = ::std::result::Result<T, Error>;
}

impl std::convert::From<errors::Error> for capnp::Error {
    fn from(e: errors::Error) -> Self {
        capnp::Error::failed(e.description().to_string())
    }
}

pub mod server_capnp {
    include!(concat!(env!("OUT_DIR"), "/capnp/server_capnp.rs"));
}

pub mod client_capnp {
    include!(concat!(env!("OUT_DIR"), "/capnp/client_capnp.rs"));
}

pub mod common_capnp {
    include!(concat!(env!("OUT_DIR"), "/capnp/common_capnp.rs"));
}

pub mod governor_capnp {
    include!(concat!(env!("OUT_DIR"), "/capnp/governor_capnp.rs"));
}

pub mod monitor_capnp {
    include!(concat!(env!("OUT_DIR"), "/capnp/monitor_capnp.rs"));
}
