var Exports = {

  get PreFiddler () {
    return bmPreFiddler.PreFiddler
  },

  newPreFiddler(...args) {
    return this.guard(Exports.PreFiddler().getFiddler(...args))
  },


  get libExports () {
    return bmChroma.Exports
  },

  get chroma() {
    return this.libExports.chroma
  },

  get ColorWords() {
    return this.libExports.ColorWords
  },
  get Schemes() {
    return this.libExports.Schemes
  },


  // used to trap access to unknown properties
  guard(target) {
    return new Proxy(target, this.validateProperties)
  },

  /**
   * for validating attempts to access non existent properties
   */
  get validateProperties() {
    return {
      get(target, prop, receiver) {
        // typeof and console use the inspect prop
        if (
          typeof prop !== 'symbol' &&
          prop !== 'inspect' &&
          !Reflect.has(target, prop)
        ) throw `guard detected attempt to get non-existent property ${prop}`

        return Reflect.get(target, prop, receiver)
      },

      set(target, prop, value, receiver) {
        if (!Reflect.has(target, prop)) throw `guard attempt to set non-existent property ${prop}`
        return Reflect.set(target, prop, value, receiver)
      }
    }
  }

}



