const testCustomSchemes = () => {


  // open the airports sheet
  const sourceFiddler = Exports.newPreFiddler({
    sheetName: "airports",
    id: 'your sheet id'
  })

  const targetFiddler = Exports.newPreFiddler({
    sheetName: "color-airports",
    id: 'your sheet id',
    createIfMissing: true
  })


  targetFiddler.setData(sourceFiddler.getData())


  // add some more columns for the test if they are not already there
  const extraCols = ['vanilla', 'material','material-strict', 'tropics'] 
  extraCols.filter(f => targetFiddler.getHeaders().indexOf(f) === -1)
    .forEach(f => targetFiddler.insertColumn(f))


  // pick up the functions we'll need from the bmChroma library
  const { getChroma, getContrast, getColorPack } = Exports.ColorWords
  const chroma = getChroma()

  // Vanilla scale
  // the idea here is to colorize using a scale according to the absolute latitude
  // first of all using normal colors from blue (cold) thru yellow(warm) then thru blue again
  // make a copy to here
  const vanillaScale = chroma.scale(['blue', 'yellow', 'blue'].map(f => chroma(f))).domain([-90, 0, 90]);

  // then use material base colors
  const materialScale = chroma.scale([
    'mc-blue', 
    'mc-yellow', 
    'mc-blue'
  ].map(f => chroma(f))).domain([-90, 0, 90]);

  // create a custom scale
  Exports.Schemes.addScheme({
    name: 'tropics',
    scheme: {
      south: 'purple',
      capricorn: 'red',
      equator: 'yellow',
      cancer: 'orange',
      north: 'blue'
    }
  })
  const tropicsScale = chroma.scale([
    'tropics-south',
    'tropics-capricorn',
    'tropics-equator',
    'tropics-cancer',
    'tropics-north'
  ].map(f => chroma(f))).domain([-90, -23.43616, 0, 23.43616, 90]);

  // function to caclculate nearest match
  // generalize this to take any mode for future reference
  // but we'll use the 'oklab' mode by default - it seems to give the best results
  const getDistance = (a, b, name = 'oklab') =>
    name === 'deltaE' ? chroma.deltaE(a, b) : chroma.distance(a, b, name)

  // we'll get the entire material color set
  const materialScheme = Exports.Schemes.listScheme('mc')
  const materialHexes = materialScheme.map(f => f.hex)

  // find the closest in the set
  const getNearest = (color, refSet = materialHexes) => refSet.reduce((p, c) => {
    const distance = getDistance(color, c)
    return distance < p.distance ? {
      distance,
      color,
      target: c
    } : p
  }, {
    distance: Infinity,
    color,
    target: null
  })

  // now lets make a color for each airport
  targetFiddler.mapRows(row => {
    row.vanilla = vanillaScale(row.latitude_deg).hex()
    row.material = materialScale(row.latitude_deg).hex()
    // how about limiting to the nearest material colors
    row['material-strict'] = getNearest(row.material).target
    row.tropics = tropicsScale (row.latitude_deg).hex()
    return row
  })

  // lets sort by latititude
  targetFiddler.setData(targetFiddler.sort('latitude_deg'))

  //see if avalues  is a hex code - naive test
  const isHex = (value) => value && value.toString().match(/^#[0-9abcdef]+$/i)

  // this function will return a closure that will color the fiddler
  const colorize = (fiddler) => {
    const backgrounds = fiddler.getData().map(row => {
      return fiddler.getHeaders().map(col => isHex(row[col]) ? row[col] : null)
    })
    const fontColors = backgrounds.map(row => {
      return row.map(col => isHex(col) ? getContrast(col) : null)
    })
    const range = fiddler.getRange()
      .offset(1, 0, backgrounds.length, backgrounds[0].length)

    range
      .setBackgrounds(backgrounds)
      .setFontColors(fontColors)

    return {
      range,
      backgrounds,
      fontColors
    }
  }

  // copy the source data and set basic header formatting
  
  const headColor =  getColorPack('black')
  targetFiddler.setHeaderFormat({
    wraps: true,
    backgrounds: headColor.hex,
    fontWeights: 'bold',
    fontColors: headColor.contrast
  })

  // dump the results
  targetFiddler.dumpValues()

  // color anything that looks like a hex
  colorize(targetFiddler)
  

}
