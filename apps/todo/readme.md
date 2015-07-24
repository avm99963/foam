<<<<<<< HEAD
# FOAM TodoMVC Example

FOAM is a collection of Javascript libraries: an Object-oriented core, MVC,
reactive programming, HTML views, data storage, and more.

See the [main site](https://foam-framework.github.io/foam) for more information.


## Learning FOAM

The [FOAM site](https://foam-framework.github.io/foam) is the place to get started.

FOAM is beta and under heavy development. The [tutorial](https://foam-framework.github.io/foam/tutorial/0-intro) is the best place to get started, and more documentation can be found in the [documentation browser](https://foam-framework.github.io/foam/foam/apps/docs/docbrowser.html).


## Implementation

The main pieces here are the `Todo` model and the controller. Both have a template - for an individual row, and for the whole page, respectively.

`Controller` is the central point of coordination for the app. It has several different reactive pieces.
- It has a property, `input`, which is bound to the new todo input box. When the user presses enter, the value from the DOM element is written to `input`, and its `postSet` will fire, adding the new `Todo` to the database.
- `dao` ("Data Access Object") is the unfiltered database of all `Todo`s.
- `filteredDAO` is a filtered view onto that database. The filter is controlled by `query`.
- The `view` property for `query` determines the appearance and behavior of the All-Active-Completed buttons.
- The one `action` is attached to the `Clear Completed` button.
- A listener, `onDAOUpdate`, fires whenever the underlying data updates. It causes the list to re-render.

Of particular interest is the line which begins

    this.filteredDAO = this.dao = TodoDAO.create({

`TodoDAO` is a simple wrapper that ensures an entry which is edited to be empty gets removed.
Its `delegate` is the underlying DAO, which here is an `EasyDAO`. `EasyDAO` is a facade that makes it easy to construct common storage patterns:
- `model` defines the type of data we're storing, here a `Todo.
- `seqNo: true` means that `Todo`'s `id` property will be auto-incremented.
- `daoType: 'StorageDAO'` means our DAO is backed by LocalStorage.
- `EasyDAO` by default caches any DAO that isn't in-memory. This means that the entire LocalStorage contents are loading into the cache at startup, and all updates are written through to memory and LocalStorage.

## Running

The only step needed to get the example working is `bower install`.

To run the app, spin up an HTTP server and visit `http://localhost:8000/`.
=======
# Framework Name TodoMVC Example

> Short description of the framework provided by the official website.

> _[Framework Name - framework.com](link-to-framework)_


## Learning Framework Name

The [Framework Name website]() is a great resource for getting started.

Here are some links you may find helpful:

* [Documentation]()
* [API Reference]()
* [Applications built with Framework Name]()
* [Blog]()
* [FAQ]()
* [Framework Name on GitHub]()

Articles and guides from the community:

* [Article 1]()
* [Article 2]()

Get help from other Framework Name users:

* [Framework Name on StackOverflow](http://stackoverflow.com/questions/tagged/____)
* [Mailing list on Google Groups]()
* [Framework Name on Twitter](http://twitter.com/____)
* [Framework Name on Google +]()

_If you have other helpful links to share, or find any of the links above no longer work, please [let us know](https://github.com/tastejs/todomvc/issues)._


## Implementation

How is the app structured? Are there deviations from the spec? If so, why?


## Running

If there is a build step required to get the example working, explain it here.

To run the app, spin up an HTTP server and visit http://localhost/.../myexample/.
>>>>>>> Initial version - basic description, TodoMVC


## Credit

<<<<<<< HEAD
This TodoMVC implementation was created by the [FOAM team](https://github.com/orgs/foam-framework/members) at Google Waterloo.
=======
This TodoMVC application was created by [you]().
>>>>>>> Initial version - basic description, TodoMVC
