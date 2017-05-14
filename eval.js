var vm = require('vm')
var isBuffer = Buffer.isBuffer

var requireLike = require('require-like')

function merge (a, b, exclude) {
  if (!a || !b) return a
  var keys = Object.keys(b)
  for (var k, i = 0, n = keys.length; i < n; i++) {
    k = keys[i]
    if(!exclude || !exclude.has(k))
      a[k] = b[k]
  }
  return a
}

// Return the exports/module.exports variable set in the content
// content (String|VmScript): required
module.exports = function (content, filename, scope, includeGlobals, excludeGlobals) {

  if (typeof filename !== 'string') {
    if (typeof filename === 'object') {
      includeGlobals = scope
      scope = filename
      filename = null
    } else if (typeof filename === 'boolean') {
      includeGlobals = filename
      scope = {}
      filename = null
    }
  }

  // Expose standard Node globals
  var sandbox = {}
  var exports = {}

  if (includeGlobals) {
    merge(sandbox, global, excludeGlobals)
    if(!excludeGlobals || !excludeGlobals.has('require'))
      sandbox.require = requireLike(filename || module.parent.filename)
  }

  if (typeof scope === 'object') {
    merge(sandbox, scope)
  }

  sandbox.exports = exports
  sandbox.module = { exports: exports }
  sandbox.global = sandbox

  var options = {
    filename: filename,
    displayErrors: false
  }

  if (isBuffer(content)) {
    content = content.toString()
  }

  // Evalutate the content with the given scope
  if (typeof content === 'string') {
    var stringScript = content.replace(/^\#\!.*/, '')
    var script = new vm.Script(stringScript, options)
    script.runInNewContext(sandbox, options)
  } else {
    content.runInNewContext(sandbox, options)
  }

  return sandbox.module.exports
}
