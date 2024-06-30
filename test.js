var formData = new FormData();

// Add key-value pairs to the FormData object
formData.append('email', 'test@hotmail.fr');
formData.append('password', 'test');

// Define the options for the fetch request
var options = {
  method: 'POST',
  headers: {'Cookie': "PHPSESSID=epn32puqjs2gent4d3cu7tmrn3"} // Set the FormData object as the request body
};
fetch("http://localhost:8765/update", options)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.text();
    })
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("Fetch error:", error);
    });