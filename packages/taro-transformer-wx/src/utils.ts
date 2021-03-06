import * as t from 'babel-types'
import generate from 'babel-generator'
import { codeFrameColumns } from '@babel/code-frame'
import { NodePath } from 'babel-traverse'
import * as fs from 'fs'
import * as path from 'path'

export const incrementId = () => {
  let id = 0
  return () => id++
}

export function isArrayMapCallExpression (callExpression: NodePath<t.Node>): callExpression is NodePath<t.CallExpression> {
  return callExpression &&
    t.isCallExpression(callExpression.node) &&
    t.isMemberExpression(callExpression.node.callee) &&
    t.isIdentifier(callExpression.node.callee.property, { name: 'map' })
}

export function buildConstVariableDeclaration (
  variableName: string,
  expresion: t.Expression
) {
  return t.variableDeclaration('const', [
    t.variableDeclarator(t.identifier(variableName), expresion)
  ])
}

export function setTemplate (name: string, path: NodePath<t.Node>, templates) {
  const parentPath = path.parentPath
  const jsxChildren = parentPath.findParent(p => p.isJSXElement())
  if (name && !jsxChildren) {
    templates.set(name, path.node)
  }
}

export function isContainFunction (p: NodePath<t.Node>) {
  let bool = false
  p.traverse({
    CallExpression () {
      bool = true
    }
  })
  return bool
}

export function pathResolver (p: string, location: string) {
  const extName = path.extname(p)
  const promotedPath = p
  if (extName === '') {
    try {
      const pathExist = fs.existsSync(path.resolve(path.dirname(location), p, 'index.js'))
      const baseNameExist = fs.existsSync(path.resolve(path.dirname(location), p) + '.js')
      if (pathExist) {
        return path.join(promotedPath, 'index.wxml')
      } else if (baseNameExist) {
        return promotedPath + '.wxml'
      }
    } catch (error) {
      return promotedPath + '.wxml'
    }
    return promotedPath + '.wxml'
  }
  return promotedPath.slice(0, promotedPath.length - extName.length) + '.wxml'
}

export function codeFrameError (loc: t.SourceLocation, msg: string) {
  return new Error(`${msg}
-----
${codeFrameColumns(setting.sourceCode, loc)}`)
}

export const setting = {
  sourceCode: ''
}

export function createUUID () {
  return '$' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16 | 0
    let v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  }).replace(/-/g, '')
}

export function isBlockIfStatement (ifStatement, blockStatement): ifStatement is NodePath<t.IfStatement> {
  return ifStatement && blockStatement &&
  ifStatement.isIfStatement() &&
  blockStatement.isBlockStatement()
}

export function buildCodeFrame (code: string) {
  return (loc: t.SourceLocation) => codeFrameColumns(code, loc) as string
}

export function isNumeric (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

export function buildJSXAttr (name: string, value: t.Identifier | t.Expression) {
  return t.jSXAttribute(t.jSXIdentifier(name), t.jSXExpressionContainer(value))
}

export function newJSXIfAttr (jsx: t.JSXElement, value: t.Identifier | t.Expression) {
  jsx.openingElement.attributes.push(buildJSXAttr('wx:if', value))
}

export function isContainJSXElement (path: NodePath<t.Node>) {
  let matched = false
  path.traverse({
    JSXElement (p) {
      matched = true
      p.stop()
    }
  })
  return matched
}

export function hasComplexExpression (path: NodePath<t.Node>) {
  let matched = false
  if (isContainJSXElement(path)) {
    return false
  }
  if (path.isTemplateLiteral() || path.isCallExpression()) {
    return true
  }
  path.traverse({
    CallExpression: (p) => {
      matched = true
      p.stop()
    },
    TemplateLiteral (p) {
      matched = true
      p.stop()
    },
    TaggedTemplateExpression (p) {
      matched = true
      p.stop()
    }
  })
  return matched
}

export function findFirstIdentifierFromMemberExpression (node: t.MemberExpression): t.Identifier {
  let id
  let object = node.object as any
  while (true) {
    if (t.identifier(object) && !t.isMemberExpression(object)) {
      id = object
      break
    }
    object = object.object
  }
  return id
}

export function getArgumentName (arg) {
  if (t.isThisExpression(arg)) {
    return 'this'
  } else if (t.isNullLiteral(arg)) {
    return 'null'
  } else if (t.isStringLiteral(arg)) {
    return arg.value
  } else if (t.isIdentifier(arg)) {
    return arg.name
  } else if (t.isMemberExpression(arg)) {
    return generate(arg).code
  }
  throw new Error(`bind 不支持传入该参数: ${arg}`)
}

export function isAllLiteral (...args) {
  return args.every(p => t.isLiteral(p))
}

export function reverseBoolean (expression: t.Expression) {
  return t.unaryExpression(
    '!',
    t.callExpression(t.identifier('Boolean'), [expression])
  )
}

export function isEmptyDeclarator (node: t.Node) {
  if (
    t.isVariableDeclarator(node) &&
    (node.init === null ||
    t.isNullLiteral(node.init))
  ) {
    return true
  }
  return false
}

export function toLetters (num: number): string {
  let mod = num % 26
  let pow = num / 26 | 0
  let out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z')
  const letter = pow ? toLetters(pow) + out : out
  return letter.toLowerCase()
}

export function findIdentifierFromStatement (statement: t.Node) {
  if (t.isVariableDeclaration(statement)) {
    const declarator = statement.declarations.find(s => t.isIdentifier(s.id))
    if (declarator && t.isIdentifier(declarator.id)) {
      return declarator.id.name
    }
  }
  return '__return'
}
