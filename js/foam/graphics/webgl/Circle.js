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

CLASS({
  package: 'foam.graphics.webgl',
  name: 'Circle',
  requires: [
    'foam.graphics.webgl.Shader',
    'foam.graphics.webgl.ArrayBuffer',
    'foam.graphics.webgl.Program',
    'foam.graphics.webgl.ScaleMatrix4'
  ],

  extendsModel: 'foam.graphics.webgl.Object',

  properties: [
    {
      name: 'color',
      defaultValueFn: function() { return [1.0, 1.0, 1.0, 1.0]; }, // white
      postSet: function() {
        // auto-set translucent rendering mode
        this.translucent = this.color[3] < 1.0;
      }
    },
    {
      name: 'segments',
      defaultValue: 64
    },
    {
      name: 'r',
      defaultValue: 1,
    },
    {
      name: 'borderRatio',
      defaultValue: 1.0,
      help: 'The proportion of radius to draw as solid. 1.0 is a filled circle, 0.01 a thin ring. Negative values extend outward.',
      postSet: function() {
        this.mesh = this.ArrayBuffer.create({
          drawMode: 'triangle strip',
          vertices: this.ringVertices()
        });
      }
    },
    {
      name: 'meshMatrix',
      lazyFactory: function() {
        return this.ScaleMatrix4.create({ sx$: this.r$, sy$: this.r$ });
      }
    },

  ],

  methods: [

    function init() {
      this.SUPER();

      this.program = this.Program.create();
      this.program.fragmentShader = this.Shader.create({
        type: "fragment",
        source:
          "precision lowp float;\n"+
          "uniform vec4 color;\n"+
          "void main(void) {\n" +
          "  gl_FragColor = color;\n"+
          "}\n"
      });
      this.program.vertexShader = this.Shader.create({
        type: "vertex",
        source: function() {/*
          attribute vec3 aVertexPosition;

          uniform mat4 positionMatrix;
          uniform mat4 relativeMatrix;
          uniform mat4 projectionMatrix;
          uniform mat4 meshMatrix;

          void main(void) {
            gl_Position = projectionMatrix * positionMatrix * relativeMatrix * meshMatrix * vec4(aVertexPosition, 1.0);
          }
        */}
        });
      //this.color = this.color; // reset the fragment shader
      this.borderRatio = this.borderRatio;
    },

    function intersects(c) {
      var r = this.r + c.r;
      var dx = this.x-c.x;
      var dy = this.y-c.y;
      return ( ((dx+dy) < r) ) && ( Movement.distance(dx, dy) < r );
    },

    function ringVertices() {
      /* Create a mesh for a 'triangle strip' hollow circle */
      var v = [].slice();
      var segs = this.segments;
      var r = 1.0;
      var b = 1.0 - this.borderRatio;
      function circPt(i) {
        return [
           (Math.sin(2 * Math.PI * i / segs) * r),
          -(Math.cos(2 * Math.PI * i / segs) * r),
          0.0
        ];
      };
      function innerPt(i) {
        return [
           (Math.sin(2 * Math.PI * i / segs) * b),
          -(Math.cos(2 * Math.PI * i / segs) * b),
          0.0
        ];
      };
      // start with the center
      v = v.concat(innerPt(0));
      v = v.concat(circPt(0));
      v = v.concat(innerPt(1));

      // add the rest of the edge vertices to complete the fan
      for (var i = 1; i < segs; i++) {
        v = v.concat(circPt(i));
        v = v.concat(innerPt(i));
      }
      v = v.concat(circPt(0));
      v = v.concat(innerPt(0));

      return v;
    },

    function circleVertices() {
      /* Create a mesh for a 'triangle fan' circle. This would be the case where borderRatio == 1.0 */
      var v = [].slice();
      var segs = this.segments;
      var r = 1;//this.r;
      function circPt(i) {
        return [
           (Math.sin(2 * Math.PI * i / segs) * r),
          -(Math.cos(2 * Math.PI * i / segs) * r),
          0.0
        ];
      };
      // start with the center
      v = v.concat([0.0, 0.0, 0.0]);

      // add the rest of the edge vertices to complete the fan
      for (var i = 0; i < segs; i++) {
        v = v.concat(circPt(i));
      }
      v = v.concat(circPt(0));
      return v;
    },

  ]

});