const devMode = localStorage.getItem("devMode");
if (document.readyState !== 'loading') {
  if(devMode == undefined) {
    main();
  }
  
} else {
  document.addEventListener('DOMContentLoaded', function () {
    if(devMode == undefined) {
      main();
    }
  });
}

function main() {

  const categoryLinks = document.querySelectorAll('#categoryNav a');

  categoryLinks.forEach(link => {
    // Get the id from the child element with id "categorySlug"
    const id = link.querySelector("#categorySlug")?.innerText;

    if (id) {
      // Set the href attribute to the id prefixed with #
      link.href = `#${id}`;
    }

    // Add a click event listener to handle the 'selected' class
    link.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent default anchor navigation

      // Remove 'selected' class from all links
      categoryLinks.forEach(l => l.classList.remove('selected'));

      // Add 'selected' class to the clicked link
      link.classList.add('selected');
    });
  });

  
  // Get all .collection-list-9 elements
  const collectionList = document.querySelector('.collection-list-9');

  if (collectionList) {
    // Find all #imageJSON elements within the collection
    const imageJSONElements = collectionList.querySelectorAll('#imageJSON');

    imageJSONElements.forEach((imageJSONElement) => {
      // Parse the JSON data from the #imageJSON element
      const images = JSON.parse(imageJSONElement.textContent || '[]');

      // Find the corresponding #imageCarousel
      const imageCarousel = imageJSONElement.parentElement.querySelector('#imageCarousel');

      if (imageCarousel && images.length > 0) {
        // Get the #templateImage to clone
        const templateImage = imageCarousel.querySelector('#templateImage');

        if (templateImage) {
          // Clear existing images (optional, if you want to reset the carousel)
          imageCarousel.innerHTML = '';

          // Iterate over the images in the JSON
          images.forEach((imageData) => {
            // Clone the #templateImage
            const newImage = templateImage.cloneNode(true);
            newImage.style.display = "block";
            // Update the src and alt attributes of the cloned image
            newImage.src = imageData.url;
            newImage.alt = imageData.alt || '';

            // Append the new image to the carousel
            imageCarousel.appendChild(newImage);
          });
        }
      }
    });
  }

  document.addEventListener('click', function (event) {

    if(event.target.closest("#imageCarousel")) {
      var subcategory = event.target.closest(".subcategory");

      //Add products to modal
      var productJSON = subcategory.querySelector("#imageJSON").innerText;
      addProductsToModal(productJSON);

      //Update collection header name
      var collectionName = subcategory.querySelector("#collectionName").innerText;

      document.getElementById("categoryName").innerText = collectionName;

      //Show modal:
      showModal();
    }

    if(event.target.id == "collectionParent") {
      hideModal();
    }

  });

  function showModal() {
    var parentDiv = document.getElementById("collectionParent");
    var bodyDiv = document.getElementById("collectionBody");

    parentDiv.style.display = "flex";
      
    // Force reflow to ensure transition works
    void bodyDiv.offsetHeight;

    bodyDiv.classList.add("selected");
  }

  function hideModal() {

    var parentDiv = document.getElementById("collectionParent");
    var bodyDiv = document.getElementById("collectionBody");

    // Force reflow to ensure transition works
    void bodyDiv.offsetHeight;

    bodyDiv.classList.remove("selected");

    parentDiv.style.display = "none";

    const collectionProducts = document.querySelectorAll("#productLink");

    // Convert NodeList to an array and slice starting from index 1
    const productsToRemove = Array.from(collectionProducts).slice(1);
    
    // Iterate through the array and remove each element
    productsToRemove.forEach(product => product.remove());
      
  }

  function addProductsToModal(productJSON) {

    // Parse the JSON string into an array of objects
    const products = JSON.parse(productJSON);
  
    // Get the product grid container and the template link element
    const productGrid = document.querySelector('#productGrid');
    const templateLink = productGrid.querySelector('#productLink');
  
    // Clear existing product links (if needed)
    productGrid.innerHTML = '';
  
    // Iterate through the products and populate the grid
    products.forEach(product => {
      // Clone the template link
      const productLinkClone = templateLink.cloneNode(true);
  
      // Update the product link href
      const linkElement = productLinkClone;
      linkElement.href = product.productLink;
  
      // Update the product image src, alt
      const productImage = productLinkClone.querySelector('#productImage');
      productImage.src = product.url;
      productImage.alt = product.alt;
  
      // Update the product name
      const productName = productLinkClone.querySelector('#productName');
      productName.textContent = product.productName;
      
      //Show the product
      productLinkClone.style.display = "block";
      // Append the cloned link to the product grid
      productGrid.appendChild(productLinkClone);
    });
  }
  
}
