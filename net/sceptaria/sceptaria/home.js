const playButton = document.getElementById('play-button');
// Home Button Click Event
playButton.addEventListener('click', function() {
    alert("Thank's For Playing Our Game! It Will Be Starting Shortly");
});
// Play Button Href Event
playButton.addEventListener('click', function() {
    window.Location.href = "./game/game.html";
});