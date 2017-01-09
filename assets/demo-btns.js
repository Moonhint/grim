const storage = require('electron-json-storage')

const demoBtns = document.querySelectorAll('.js-container-target')

// Listen for demo button clicks
Array.prototype.forEach.call(demoBtns, function (btn) {
  btn.addEventListener('click', function (event) {
    event.target.parentElement.classList.toggle('is-open')

    // Save currently active demo button in localStorage
    storage.set('activeDemoButtonId', event.target.getAttribute('id'), function (err) {
      if (err) return console.error(err)
    })
  })
})

// Default to the demo that was active the last time the app was open
storage.get('activeDemoButtonId', function (err, id) {
  if (err) return console.error(err)
  if (id && id.length) {
    //Set default open demo
    if (id !== 'create-bill-demo-toggle') document.getElementById('create-bill-demo-toggle').parentElement.classList.toggle('is-open')
    if (id !== 'after-payment-lists-demo-toggle') document.getElementById('after-payment-lists-demo-toggle').parentElement.classList.toggle('is-open')
    if (id !== 'before-payment-lists-demo-toggle') document.getElementById('before-payment-lists-demo-toggle').parentElement.classList.toggle('is-open')
    if (id !== 'receipt-demo-toggle') document.getElementById('receipt-demo-toggle').parentElement.classList.toggle('is-open')

    document.getElementById(id).click()
  }
})
