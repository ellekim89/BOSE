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

   $('.favorite-delete').click(function(e) {
    e.preventDefault();
    var button = $(this);
    console.log(button.attr('href'));
    $.ajax({
      url: button.attr("href"),
      method: "DELETE"
    }).done(function(data) {
      if (data.msg === "OK")
        button.parent().remove();
    });
  });


  // $('#nav .favorites').length > 0
  console.log(currentUser);

// progress bar begin
$(function() {
    $( "#progressbar" ).progressbar({
      value: 37
    });
  });
// progress bar end

});