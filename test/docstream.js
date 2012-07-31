
var sentinel = Number(process.argv[2]);
if (isNaN(sentinel))
  sentinel = 5;
var interval = setInterval(function () {
  sentinel--;
  if (sentinel <= 0) {
    clearInterval(interval);
  }
  console.log(JSON.stringify({foo: "bar"}))
}, 1000);
