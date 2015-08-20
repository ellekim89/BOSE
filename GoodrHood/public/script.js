$( window ).load(function() {
  console.log('working')
  $('#nav ul').on('mousover', 'li', function(){
    $(this).css('background-color', '#37A2A9');
}).fadeIn('slow', 1);


});