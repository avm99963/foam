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
  name: 'KioskAppConfig',
  extendsModel: 'foam.apps.builder.AppConfig',

  properties: [
    {
      model_: 'StringProperty',
      name: 'homepage',
      label: 'Homepage',
      help: multiline(function() {/*
        Initial page for the app that is also associated with 'going home.'
      */}),
      view: {
        model_: 'foam.ui.md.TextFieldView',
        placeholder: 'http://www.example.com',
        type: 'url',
        required: true
      },
      defaultValue: 'http://www.google.com',
    },
    {
      model_: 'BooleanProperty',
      name: 'enableNavBttns',
      label: 'Enable back/forward navigation buttons',
      defaultValue: true
    },
    {
      model_: 'BooleanProperty',
      name: 'enableHomeBttn',
      label: 'Enable home button',
      defaultValue: true
    },
    {
      model_: 'BooleanProperty',
      name: 'enableReloadBttn',
      label: 'Enable reload button',
      defaultValue: true
    },
    {
      model_: 'BooleanProperty',
      name: 'enableLogoutBttn',
      label: 'Enable restart session button',
      defaultValue: true
    },
    {
      model_: 'BooleanProperty',
      name: 'enableNavBar',
      label: 'Enable navigation bar',
      defaultValue: false
    },
    {
      // model_: 'RangeDefaultIntProperty',
      name: 'sessionDataTimeoutTime',
      label: 'Session idle timeout',
      help: 'Time (in minutes) the app is idle before clearing browsing data.',
      rangeDescription: '1 - 1440 minutes',
      defaultDescription: '0 = unlimited',
      // view: 'RangeDefaultTextFieldView'
    },
    {
      // model_: 'RangeDefaultIntProperty',
      name: 'sessionTimeoutTime',
      label: 'Timeout to return home',
      help: multiline(function() {/*
        Time (in minutes) the app is idle before returning to the homepage.
        Browsing data is not cleared.
      */}),
      rangeDescription: '1 - 1440 minutes',
      defaultDescription: '0 = unlimited',
      // view: 'RangeDefaultTextFieldView'
    }
  ]
});
