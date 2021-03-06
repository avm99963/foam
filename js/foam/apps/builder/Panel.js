/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

CLASS({
  package: 'foam.apps.builder',
  name: 'Panel',
  extendsModel: 'foam.ui.View',

  properties: [
    {
      model_: 'foam.core.types.StringEnumProperty',
      name: 'pos',
      defaultValue: 'bottom',
      view: 'foam.ui.md.PopupChoiceView',
      choices: [
        ['bottom', 'Bottom'],
        ['right', 'Right'],
        ['top', 'Top'],
        ['left', 'Left'],
        ['full', 'Full'],
        ['hidden', 'Hidden'],
      ],
    },
    {
      model_: 'ViewFactoryProperty',
      name: 'innerView',
      defaultValue: 'foam.ui.md.DetailView'
    },
  ],

  actions: [
    {
      name: 'moveToTop',
      keyboardShortcuts: ['shift-up'],
      action: function() {
        console.log('MOVE TO TOP');
        this.pos = 'top';
      },
    },
    {
      name: 'moveToBottom',
      keyboardShortcuts: ['shift-down'],
      action: function() {
        console.log('MOVE TO BOTTOM');
        this.pos = 'bottom';
      },
    },
    {
      name: 'moveToLeft',
      keyboardShortcuts: ['shift-left'],
      action: function() {
        console.log('MOVE TO LEFT');
        this.pos = 'left';
      },
    },
    {
      name: 'moveToRight',
      keyboardShortcuts: ['shift-right'],
      action: function() {
        console.log('MOVE TO RIGHT');
        this.pos = 'right';
      },
    },
    {
      name: 'moveToFull',
      keyboardShortcuts: ['alt-shift-up'],
      action: function() {
        console.log('MOVE TO FULL');
        this.pos = 'full';
      },
    },
    {
      name: 'moveToHidden',
      keyboardShortcuts: ['alt-shift-down'],
      action: function() {
        console.log('MOVE TO HIDE');
        this.pos = 'hidden';
      },
    },
  ],

  templates: [
    function toHTML() {/*
      <panel id="%%id" <%= this.cssClassAttr() %>>
        <%= this.innerView({ data$: this.data$ }, this.Y) %>
      </panel>
      <%
        ['bottom', 'right', 'top', 'left', 'full', 'hidden'].forEach(function(pos) {
          this.setClass(pos, function() {
            return this.pos === pos;
          }.bind(this), this.id);
        }.bind(this));
      %>
    */},
    function CSS() {/*
      panel {
        display: block;
        position: absolute;
        min-width: 400px;
        min-height: 150px;
        background: #fff;
        overflow-x: hidden;
        overflow-y: auto;
        transition: top 0.2s cubic-bezier(0,.3,.8,1), right 0.2s cubic-bezier(0,.3,.8,1), bottom 0.2s cubic-bezier(0,.3,.8,1), left 0.2s cubic-bezier(0,.3,.8,1);
      }
      panel.bottom, panel.top {
        left: 0px;
        right: 0px;
      }
      panel.right, panel.left {
        top: 0px;
        bottom: 0px;
      }
      panel.bottom {
        bottom: 0px;
        top: 70%;
        box-shadow: -1px 0px 4px rgba(0, 0, 0, 0.48);
      }
      panel.right {
        right: 0px;
        left: 60%;
        box-shadow: 0px -1px 4px rgba(0, 0, 0, 0.48);
      }
      panel.top {
        top: 0px;
        bottom: 70%;
        box-shadow: 1px 0px 4px rgba(0, 0, 0, 0.48);
      }
      panel.left {
        left: 0px;
        right: 60%;
        box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.48);
      }
      panel.hidden {
        top: 0px;
        left: 0px;
        right: 100%;
        bottom: 100%;
      }
      panel.full {
        top: 0px;
        right: 0px;
        bottom: 0px;
        left: 0px;
      }
    */}
  ]
});
