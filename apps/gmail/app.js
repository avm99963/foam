var mgmail;

window.onload = function() {
  var Y = bootCORE(Application.create({
    name: 'MBug'
  }));

  aseq(
    arequire('Action'),
    arequire('Arg'),
    arequire('Method'),
    arequire('Interface'),
    arequire('Template'),
    arequire('Relationship'),
    arequire('foam.ui.Tooltip'),
    arequire('foam.ui.AutocompleteView'),
    arequire('WindowHashValue'),
    arequire('foam.ui.SwipeAltView'),
    arequire('VerticalScrollbarView'),
    arequire('ActionSheetView'),
    arequire('FloatingView'),
    arequire('StringEnumProperty'),
    arequire('EnumPropertyTrait'),
    arequire('ViewSlider'),
    arequire('OverlaySlider'),
    arequire('GridView'),
    arequire('ScrollView'),
    arequire('RelationshipView'),
    arequire('RelationshipsView'),
    arequire('LinkView'),
    arequire('Expr'),
    arequire('AbstractDAO'),
    arequire('foam.ui.StackView'),
    arequire('foam.ui.DAOController'),
    arequire('foam.ui.DAOCreateController'),
    arequire('OAuth2WebClient'),
    arequire('EMail'),
    arequire('EMailLabelProperty'),
    arequire('EMailMutationAction'),
    arequire('foam.ui.TextFieldView'),
    arequire('foam.ui.View'),
    arequire('foam.ui.md.AppController'),
    arequire('foam.ui.md.MonogramStringView'),
    arequire('GMailDraft'),
    arequire('GMailHistory'),
    arequire('GMailLabel'),
    arequire('FOAMGMailLabel'),
    arequire('GMailMessage'),
    arequire('GMailThread'),
    arequire('EMailView'),
    arequire('EMailComposeView'),
    arequire('EMailCitationView'),
    arequire('MenuView'),
    arequire('MenuLabelCitationView'),
    arequire('Window'),
    arequire('MGmail'),
    arequire('PositionedDOMViewTrait'),
    arequire('PositionedViewTrait'),
    arequire('foam.input.touch.TouchManager'),
    arequire('foam.input.touch.GestureManager'),
    arequire('foam.input.touch.ScrollGesture'),
    arequire('foam.input.touch.TapGesture'),
    arequire('foam.input.touch.DragGesture'),
    arequire('foam.input.touch.PinchTwistGesture'),
    arequire('OAuth2'),
    arequire('XHR'),
    arequire('LimitedLiveCachingDAO'),
    arequire('ProxyDAO'),
    arequire('GMailToEMailDAO'),
    arequire('AbstractAdapterDAO'),
    arequire('GMailMessageDAO'),
    arequire('GMailRestDAO'),
    arequire('RestDAO'),
    arequire('DelayDecorator'),
    arequire('OAuthXhrDecorator'),
    arequire('RetryDecorator'),
    arequire('NullDAO'),
    arequire('CachingDAO'),
    arequire('IDBDAO'),
    arequire('FutureDAO'),
    arequire('CountExpr'),
    arequire('FOAMGMailMessage'),
    arequire('foam.input.touch.GestureTarget'),
    arequire('DescExpr'),
    arequire('UNARY'),
    arequire('foam.ui.PopupChoiceView'),
    arequire('foam.ui.AbstractChoiceView'),
    arequire('foam.ui.AbstractDAOView'),
    arequire('foam.ui.DetailView'),
    arequire('ActionButtonCView'),
    arequire('foam.graphics.CView'),
    arequire('Circle2'),
    arequire('foam.ui.PropertyView'),
    arequire('foam.graphics.CViewView'),
    arequire('EqExpr'),
    arequire('BINARY'),
    arequire('ConstantExpr'),
    arequire('foam.ui.PopupView'),
    arequire('foam.ui.UpdateDetailView'),
    arequire('DescribeExpr'),
    arequire('InExpr'),
    arequire('GtExpr'),
    arequire('GteExpr'),
    arequire('LtExpr'),
    arequire('LteExpr'),
    arequire('ScrollViewRow'),
    arequire('RelativeDateTimeFieldView'),
    arequire('DateTimeFieldView'),
    arequire('foam.ui.ImageBooleanView'))(function() {
      var w = Y.Window.create({ window: window });
      mgmail = Y.MGmail.create({});
      w.view = mgmail;
    });
};
