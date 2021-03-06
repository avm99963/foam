/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
MODEL({
  package: 'foam.demos.sevenguis',
  name: 'CellParser',
  extendsModel: 'foam.parse.Grammar',

  methods: {
*/

var CellParser = {
  __proto__: grammar,

  START: alt(
    sym('number'),
    sym('formula'),
    sym('string')
  ),
  
  formula: seq1(1, '=', sym('expr')),
  
  expr: alt(
    sym('number'),
    sym('cell'),
    sym('add'),
    sym('sub'),
    sym('mul'),
    sym('div'),
    sym('mod'),
    seq('sum(',  sym('range'), ')'),
    seq('prod(', sym('range'), ')')
  ),
  
  add: seq('add(', sym('expr'), ',', sym('expr'), ')'),
  sub: seq('sub(', sym('expr'), ',', sym('expr'), ')'),
  mul: seq('mul(', sym('expr'), ',', sym('expr'), ')'),
  div: seq('div(', sym('expr'), ',', sym('expr'), ')'),
  mod: seq('mod(', sym('expr'), ',', sym('expr'), ')'),

  range: seq(sym('cell'), ':', sym('cell')),
  
  digit: range('0', '9'),
  
  number: str(seq(
    optional('-'),
    str(alt(
      plus(sym('digit')),
      seq(repeat(sym('digit')), '.', plus(sym('digit'))))))),
  
  cell: seq(sym('col'), sym('row')),
  
  col: alt(sym('az'), sym('AZ')),
  
  az: range('a', 'z'),
  
  AZ: range('A', 'Z'),
  
  row: str(repeat(sym('digit'), null, 1, 2)),
  
  string: str(repeat(anyChar))
}.addActions({
  add: function(a) { return function() { return a[1]() + a[3](); }; },
  sub: function(a) { return function() { return a[1]() - a[3](); }; },
  mul: function(a) { return function() { return a[1]() * a[3](); }; },
  div: function(a) { return function() { return a[1]() / a[3](); }; },
  mod: function(a) { return function() { return a[1]() % a[3](); }; },
  az: function(c) { return c.charCodeAt(0) - 'a'.charCodeAt(0); },
  AZ: function(c) { return c.charCodeAt(0) - 'A'.charCodeAt(0); },
  row: function(c) { return parseInt(c); },
  number: function(s) { var f = parseFloat(s); return function() { return f; }; },
  cell: function(a) { return function(cells) { return cells.cell(a[0], a[1]).value; }; },
  string: function(s) { return function() { return s; }; }
});
//});


// https://www.artima.com/pins1ed/the-scells-spreadsheet.html
MODEL({
  package: 'foam.demos.sevenguis',
  name: 'Cell',
  extendsModel: 'foam.ui.View',
  imports: [ 'cells', 'parser' ],
  properties: [
    {
      name: 'formula',
      displayWidth: 12
    },
    {
      name: 'value',
      displayWidth: 12
    }
  ],
  methods: [
  ],
  templates: [
    function toHTML() {/*
      $$formula $$value{mode: 'read-only'}
    */}
  ]
});


MODEL({
  package: 'foam.demos.sevenguis',
  name: 'Cells',
  extendsModel: 'foam.ui.View',
  requires: [
//    'foam.demos.sevenguis.CellParser',
    'foam.demos.sevenguis.Cell'
  ],
  exports: [
    'as cells',
    'parser'
  ],
  constants: {
    ROWS: 10 /* 99 */
  },
  properties: [
    {
      name: 'cells',
      factory: function() { return {}; }
    },
    {
      name: 'parser',
      factory: function() { return /*this.*/CellParser/*.create()*/; }
    }
  ],
  methods: [
    function init() {
      this.SUPER();

      var self = this;
      function t(s) {
        try {
          console.log('parsing: ', s);
          var ret = self.parser.parseString(s);
        console.log(ret);
          console.log(ret(self));
        } catch (x) {
        }
      }

      this.cell(0,1).value = 42;
      this.cell(1,1).value = 1;
      this.cell(2,2).value = 2;

      t('1');
      t('10');
      t('10.1');
      t('-10.1');
      t('foobar');
      t('=add(1,2)');
      t('=sub(2,1)');
      t('=mul(2,3)');
      t('=div(9,3)');
      t('=mod(8,3)');
      t('=add(mul(2,3),div(3,2))');
      t('=A1')
    },
    function cell(col, row) {
      var row = this.cells[row] || ( this.cells[row] = {} );
      return row[col] || ( row[col] = this.Cell.create() );
    }
  ],
  templates: [
    function CSS() {/*
      .cells { overflow: auto; }
      .cell { min-width: 60px; }
    */},
    function toHTML() {/*
      <table border class="cells">
        <tr>
          <td></td>
          <% for ( var i = 65 ; i <= 90 ; i++ ) { %>
            <th><%= String.fromCharCode(i) %></th>
          <% } %>
        </tr>
        <% for ( i = 0 ; i <= this.ROWS ; i++ ) { %>
          <tr>
            <th><%= i %></th>
            <% for ( var j = 65 ; j <= 90 ; j++ ) { %>
              <td class="cell"><%= this.cell(i, j) %></td>
            <% } %>
          </tr>
        <% } %>
      </table>
    */}
  ]
});

// 9-12