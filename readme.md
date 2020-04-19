Status: Not yet published

### Usage

## Initializing the Store
Initialise a store on boot...
```js
import ReactSimpleStore from 'react-simple-store';

new ReactSimpleStore.Store({
  modules: {
    login: {
      namespaced: true, // if false, these will be assigned to global namespace
      getters: {},
      actions: {},
      mutations: {},
      state: {},
    },
  },
  getters: {},
  actions: {},
  mutations: {},
  state: {},
});
```

## State
State is configured as a plain old java script object.

```js
  export default {
    isLoggedIn: false,
    todoItems: [],
  };
```

## Getters/Actions/Mutations

```js
// Getter, used outside of commponents, in services for example
const isLoggedIn = ({ state }) => state.isLoggedIn;

// Action -- performed asynchronously
const getToDoItems = ({ state, commit }, user) => {
  axios.get(`todo_items/${user.id}`).then(response => {
    commit('SET_TODO_ITEMS', response.data);
  });
};

// Mutation -- performed asynchronously
const SET_TODO_ITEMS = ({ state }, todoItems) => {
  state.todoItems = todoItems;
};

export default {
  getters: { isLoggedIn },
  actions: { getTodoItems },
  mutations: { SET_TODO_ITEMS },
};
```


## Using in Class components

```js
// ToDoList.js
import React from 'react';
import { bindState } from 'react-simple-store';

export default bindState(['todoItems'],
  class ToDoList extends React.component {

    render() {
      const listItems = this.state.todoItems.map(item => <li>{item.name}</li>)

      return (
        <ul>
          { listItems }
        </ul>
      )
    }
  }
);
```

## Using in Function components
Although counter-intuitive, `react-simple-store` wraps your function components such that you can refer to `this.state` within them, just as you would within a class' `render()` function.
```js
import { bindState } from 'react-simple-store';

export default bindState(['todoItems'],
  function ToDoList(props) {
    const listItems = this.state.todoItems.map(item => <li>{item.name}</li>)

    return (
      <ul>
        { listItems }
      </ul>
    )
  }
)
```

## Notes on mutating state
State cannot be mutated directly through the components by setting `this.state.todoItems = []` for example.

If you want to alter something in the store, use a `mutation` or `action`.

To do so, bind them in your class' constructor:
```js
import { bindState, bindMutations, bindActions } from 'react-simple-store';

export default bindState(['todoItems'],
  class ToDoList extends React.component {
    constructor(props) {
      super(props);

      Object.assign(
        this,
        bindMutations(['SET_TODO_ITEMS']),
        bindAction(['getTodoItems'])
      )

      this.state.loading = true;
    }

    componentDidMount() {
      this.getTodoItems().then(() => (  // will asynchronously get todo items
        this.state.loading = false;
      ));
    }

    render() {
      const listItems = this.state.todoItems.map(item => <li>{item.name}</li>)

      return (
        this.state.loading ? (
          <div>Loading...</div>
        ) : (
          <ul>
            { listItems }
          </ul>
        )
      )
    }
  }
);
```

## Using Namespaces
We've seen above how to bind to state without a namespace, technically the 'global' namespace. To bind to a namespaced item, use:
```js
  bindState({
      namespace: ['prop1', 'prop2'],
      otherNamespace: ['prop1', 'prop2']
    },
    component
  );
```
