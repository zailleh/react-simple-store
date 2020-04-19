function ReactSimpleStore() {
  const reactSimpleStore = this;
  const privateStore = {};
  const stores = {};
  const getters = {};
  const actions = {};
  const mutations = {};
  const listeners = {};

  function listenersGarbageCollection(prop, component, namespace) {
    listeners[namespace][prop] = listeners[namespace][prop]
      .filter(listener => listener !== component)
  }

  const updateState = function(prop, value, namespace) {
    if (privateStore[namespace].hasOwnProperty(prop)) {
      privateStore[namespace][prop] = value;

      listeners[namespace][prop].forEach(listener => {
        if (listener.updater.isMounted(listener)) {
          listener.setState({ [prop]: value });
        }
      });
    }
  }

  const setupAccessors = function(object, namespace) {
    Object.keys(object).forEach(key => {
      const privateKey = `_${key}`;

      privateStore[namespace][privateKey] = object[key];

      Object.defineProperty(
        stores[namespace],
        key,
        {
          get: function() { return privateStore[namespace][privateKey]; },
          set: function(value) {
            updateState(privateKey, value, namespace);
            return value;
          },
        },
      );
    });
  }

  const setupModules = function(modules) {
    Object.keys(modules).forEach(module => {
      let namespace = 'global';
      if(module.namespaced) {
        namespace = module;
      }

      setupAccessors(module.state, namespace);
      getters[namespace] = { ...getters[namespace], ...module.getters };
      actions[namespace] = { ...actions[namespace], ...module.actions };
      mutations[namespace] = { ...mutations[namespace], ...module.mutations };
    })
  }

  this.Store = class Store {
    constructor({ modules, ...global }) {
      reactSimpleStore.Store = this;

      setupModules(modules);
      setupModules({ global });
    }
  }

  this.bindState = function(...args) {
    const namespace = args[args.length - 3] || 'global';
    const selectedProps = args[args.length - 2];
    const klass = args[args.length - 1];

    const state = stores[namespace];

    const selected = {};
    selectedProps.forEach(prop => {
      if (state.hasOwnProperty(prop)) {
        selected[prop] = state[prop];
      }
    });

    if (klass.prototype.hasOwnProperty('render')) {
      return class ReactSimpleStateComponentWrapper extends klass {
        constructor(props) {
          super(props)

          this.state = { ...this.state, ...selected };
          Object.keys(selected).forEach(prop => listeners[prop].push(this));
        }

        componentWillUnmount() {
          selectedProps.forEach(prop => {
            listenersGarbageCollection(prop, this, namespace);
          });
        }
      }
    } else if (typeof klass === 'function') {
      return class ReactSimpleStateComponentWrapper extends React.Component {
        constructor(props) {
          super(props)
          this.state = { ...this.state, ...selected };
          Object.keys(selected).forEach(prop => listeners[prop].push(this));
        }

        componentWillUnmount() {
          selectedProps.forEach(prop => {
            listenersGarbageCollection(prop, this, namespace);
          });
        }

        render() {
          return klass.bind(this)(this.props);
        }
      }
    } else {
      throw new Error('Not a Valid React Component or Function');
    }
  };

  function bindStore(type, ...args) {
    const namespace = args[args.length - 2] || 'global';
    const props = args[args.length - 1];
    const local = this[type][namespace];

    const bound = {};
    props.forEach(prop => {
      if (local.hasOwnProperty(prop)) {
        bound[prop] = function(...args) {
          return local[prop]({
            store: stores[namespace]
          },
          ...args,
          )
        }
      }
    });

    return bound;
  }

  this.bindMutations = function(...args) {
    return bindStore('mutations', ...args);
  };

  this.bindGetters = function(...args) {
    return bindStore('getters', ...args);
  };

  this.bindActions = function(...args) {
    return bindStore('actions', ...args);
  }
};

let reactSimpleStore;

export default (() => {
  if (!reactSimpleStore) {
    reactSimpleStore = new ReactSimpleStore();
  }

  return reactSimpleStore;
})();
