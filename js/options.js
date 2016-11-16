(function($) {
function save_options() {
  var endpoint = document.getElementById('endpoint').value;
  chrome.storage.sync.set({
    endpoint: endpoint 
  }, function() {
    document.getElementById('status').append('Options saved.');
    console.log(status.textContent);
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

chrome.storage.sync.get(null, function(items) {
    if(items.endpoint || items.timezone) {
        document.getElementById('cendpoint').append(items.endpoint);
    }
});


document.getElementById('save').addEventListener('click',
    save_options);
})(jQuery);
