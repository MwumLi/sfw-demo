window.loadComponent = ( function() {
  function fetchAndParse( URL ) {
    return fetch( URL )
      .then( ( response ) => {
        return response.text();
      })
    .then( ( html ) => {
      const parser = new DOMParser(); // 1
      const document = parser.parseFromString( html, 'text/html' );
      const head = document.head;
      const template = head.querySelector( 'template' );
      const style = head.querySelector( 'style' );
      const script = head.querySelector( 'script' );
      return {
        template,
        style,
        script
      };
    });
  }

  function getSettings( { template, style, script } ) {
    // const jsFile = new Blob( [ script.textContent ], { type: 'application/javascript' } );
    // const jsURL = URL.createObjectURL( jsFile );
    const jsURL = 'data:application/javascript;base64,' + btoa(script.textContent)
    function getListeners( settings ) { // 1
      const listeners = {};

      Object.entries( settings ).forEach( ( [ setting, value ] ) => { // 3
        if ( setting.startsWith( 'on' ) ) { // 4
          const listener =  setting[ 2 ].toLowerCase() + setting.substr( 3 );
          listeners[listener] = value; // 5
        }
      } );

      return listeners;
    }

    return import( jsURL ).then( ( module ) => {
      console.log(module);
      const listeners = getListeners( module.default ); // 2
      return {
        name: module.default.name,
        listeners,
        template,
        style
      }
    });
  }

  function registerComponent({ name, template, style, listeners }) {
    class UnityComponent extends HTMLElement {
      connectedCallback() {
        this._upcast();
        this._attachListeners();
      }

      _upcast() {
        const shadow = this.attachShadow( { mode: 'open' } );

        shadow.appendChild( style.cloneNode( true ) );
        shadow.appendChild( document.importNode( template.content, true ) );
      }

      _attachListeners() {
        Object.entries( listeners ).forEach( ( [ event, listener ] ) => { // 3
          this.addEventListener( event, listener, false ); // 4
        } );
      }
    }
    return customElements.define( name, UnityComponent );
  }

  function loadComponent( URL ) {
    return fetchAndParse( URL ).then( getSettings ).then( registerComponent );
  }

  return loadComponent;
}() );
