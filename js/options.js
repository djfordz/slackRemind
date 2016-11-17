(function($) {
function save_options() {
  var endpoint = document.getElementById('endpoint').value;
  chrome.storage.sync.set({
    endpoint: endpoint 
  }, function() {
      var status = document.getElementById('status');
          status.append('Options saved.');
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
  listEndpoint();
}

function showEndpoint(storedData) {
    if(typeof(storedData) !== 'undefined') {
        if(storedData.endpoint) {
            var el = document.getElementById('cendpoint');
            if(el !== null)
                el.textContent = '';
                el.append(storedData.endpoint);
        }
    }

}

function listEndpoint() {
    chrome.storage.sync.get('endpoint', showEndpoint);
}


document.getElementById('save').addEventListener('click',
    save_options);
listEndpoint();
})(jQuery);
