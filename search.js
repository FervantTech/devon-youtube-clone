const searchBar = document.getElementById("search-bar");

searchBar.addEventListener("input", () => {
    const searchTerm = searchBar.value.toLowerCase();

    const videos = document.querySelectorAll(".video");

    videos.forEach(video => {
        const title = video.querySelector(".video-details p")
            .textContent
            .toLowerCase();

        if (title.includes(searchTerm)) {
            video.style.display = "block";
        } else {
            video.style.display = "none";
        }
    });
});