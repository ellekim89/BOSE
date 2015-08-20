$( window ).load(function() {
  console.log('working')
  $('#nav ul').on('mousover', 'li', function(){
    $(this).css('background-color', '#37A2A9');
}).fadeIn('slow', 1);

  if(currentUser != false){
    $('.signup_nav').hide();
    $('.login_nav').hide();
  } else if (currentUser === false){
    $('.favorites_nav').hide();
    $('.logout_nav').hide();
  }
  // $('#nav .favorites').length > 0
  console.log(currentUser);

});