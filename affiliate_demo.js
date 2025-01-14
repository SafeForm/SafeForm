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

  // ---------------------------------------------
  // 1) GRAB THE "DEFAULT" SUBCATEGORY + PREVIEW CONTAINERS
  //    We will clone these for each new category.
  // ---------------------------------------------
  const defaultSubcategoryList = document.getElementById('subcategoryList');
  const defaultPreviewContainer = document.querySelector('.div-block-684');

  // Make sure we have them (in case something is missing in HTML):
  if (!defaultSubcategoryList || !defaultPreviewContainer) {
    console.warn("Cannot find default subcategoryList or .div-block-684 in the DOM.");
  }

  // By default, these belong to the *initial* category (if any).
  // If you already have one "default" category button in the HTML,
  // you might link them via data attributes. If not, the first
  // category you add will effectively become "default."
  // 
  // For demonstration, let's just keep them visible for the first category,
  // but we will hide them for new categories until that category is selected.

  // ---------------------------------------------
  // 2) MAKE SORTABLE SETUPS
  // ---------------------------------------------

  // After sorting, update the order of categoryPreviewList to match horizontal-category-div
  var sortable = new Sortable(document.querySelector(".horizontal-category-div"), {
    animation: 150,
    dragClass: "sortable-ghost",
    swapThreshold: 0.2,
    handle: "#dragHandle",
    onEnd: function () {
      // Get all category buttons and extract their text content
      const buttons = Array.from(document.querySelectorAll('.horizontal-category-div .category-button'));
      const buttonOrder = buttons.map(button => button.textContent.trim());
      
      const previewList = document.querySelector('#categoryPreviewList');
      const previews = Array.from(document.querySelectorAll('#categoryPreviewList #categoryPreview'));
      
      // Sort previews based on the new button order
      const reorderedPreviews = buttonOrder.map(buttonText => {
        return previews.find(preview => preview.textContent.trim() === buttonText);
      });
      
      // Clear and repopulate the preview list
      previewList.innerHTML = '';
      reorderedPreviews.forEach(preview => {
        if (preview) previewList.appendChild(preview);
      });
    }
  });

  var productSortable = new Sortable(document.querySelector("#productList"), {
    animation: 150,
    dragClass: "sortable-ghost",
    swapThreshold: 0.2,
    handle: "#dragElement"
  });

  // ---------------------------------------------
  // 3) CATEGORY NAME UPDATING
  // ---------------------------------------------
  const categoryInput = document.getElementById('categoryName');
  categoryInput.addEventListener('input', () => {
    // Get the currently selected button
    const selectedButton = document.querySelector('.category-button.selected');
    if (selectedButton) {
      // Update the text content of the selected button
      selectedButton.querySelector("div").innerText = categoryInput.value;

      // Get the index of the selected button
      const buttons = Array.from(document.querySelectorAll('.horizontal-category-div .category-button'));
      const index = buttons.indexOf(selectedButton);

      // Update the corresponding preview
      const previews = document.querySelectorAll('#categoryPreviewList #categoryPreview');
      if (previews[index]) {
        previews[index].innerText = categoryInput.value || "Category Name";
      }
    }
  });


  // ---------------------------------------------
  // 4) PRODUCT LINK PREVIEW + PAGE TITLE FETCH
  // ---------------------------------------------
  document.getElementById('affiliateProductLink').addEventListener('input', async function() {
    const link = this.value.trim(); // get the entered URL

    // Elements we need to manipulate
    const productPreviewImage = document.getElementById('productPreviewImage');
    const previewImageText = document.getElementById('previewImageText');

    // If the input is empty, hide the image and show the text
    if (!link) {
      productPreviewImage.style.display = 'none';
      previewImageText.style.display = 'flex';
      return;
    }

    // Ensure it's a valid URL before proceeding
    let validUrl;
    try {
      validUrl = new URL(link);  // Will throw an error if invalid
    } catch (e) {
      // Not a valid URL, hide image & show text
      productPreviewImage.style.display = 'none';
      previewImageText.style.display = 'flex';
      return;
    }

    // Fetch preview image
    const previewImage = await getPreviewImage(validUrl.href);

    // If an image is found, show it; otherwise, show placeholder text
    if (previewImage) {
      productPreviewImage.src = previewImage;
      productPreviewImage.style.display = 'block';
      previewImageText.style.display = 'none';
    } else {
      productPreviewImage.style.display = 'none';
      previewImageText.style.display = 'flex';
    }

    // Fetch page title
    const productName = await getPageTitle(validUrl.href);
    if (productName) {
      document.getElementById("productName").value = productName;
    }
  });


  // ---------------------------------------------
  // 5) MAIN CLICK HANDLER (Add Category, etc.)
  // ---------------------------------------------
  document.addEventListener('click', function (event) {

    if (event.target.closest("#addSubCategory")) {
      document.getElementById("storeFrontPage").style.display = "none";
      document.getElementById("productPage").style.display = "flex";
      document.getElementById("storefrontHeader").style.display = "none";
      document.getElementById("productPageHeader").style.display = "flex";
    }

    if (event.target.id == "deleteSubCategory") {
      var subCategoryItem = event.target.closest("#subCategoryItem");
      subCategoryItem.remove();
    }

    if (event.target.closest("#saveProduct")) {
      document.getElementById("storeFrontPage").style.display = "flex";
      document.getElementById("productPage").style.display = "none";
      document.getElementById("storefrontHeader").style.display = "flex";
      document.getElementById("productPageHeader").style.display = "none";
      createProductsAndSubCategory();
      addSubCategoryToList();
      clearSubCategoryPage();
    }

    if (event.target.id == "submitProductButton") {
      cloneAndAddProduct();
    }

    if (event.target.id == "deleteCategory") {
      const selectedButton = document.querySelector('.category-button.selected');
      if (selectedButton) {
        const selectedText = selectedButton.querySelector('.text-block-361').textContent.trim();
        
        // Find the corresponding preview
        const previewList = document.querySelectorAll("#categoryPreviewList #categoryPreview");
        let correspondingPreview = null;
        previewList.forEach(preview => {
          const previewText = preview.textContent.trim();
          if (previewText === selectedText) {
            correspondingPreview = preview;
          }
        });
        
        if (correspondingPreview) {
          correspondingPreview.remove();
        }
      
        // Also remove the subcategory container + preview container tied to this button
        // *** ADDED ***
        const subCatId = selectedButton.getAttribute("data-subcategory-list-id");
        const prevCatId = selectedButton.getAttribute("data-preview-container-id");
        if (subCatId) {
          const scElement = document.getElementById(subCatId);
          if (scElement) scElement.remove();
        }
        if (prevCatId) {
          const pvElement = document.getElementById(prevCatId);
          if (pvElement) pvElement.remove();
        }
        // *** END ***

        // Remove the selected button
        selectedButton.remove();

        // Clear the input
        document.getElementById("categoryName").value = "";
      }
    }

    if (event.target.id == "deleteProduct") {
      event.target.closest("#productItem").remove();
    }

    if (event.target.id == "copyProductLink") {
      var productLink = event.target.closest("#productItem").querySelector("#productLink").href;
      navigator.clipboard.writeText(productLink);
    
      var copiedImage = event.target.closest("#productItem").querySelector("#copiedImage");
      copiedImage.style.display = "block";

      setTimeout(function() {
        copiedImage.style.display = "none";
      }, 1000);
    }

    if (event.target.id == "createProductModal" || event.target.id == "closeProductModal") {
      clearProductForm();
    }

    if (event.target.closest("#addProduct")) {
      document.getElementById("createProductModal").style.display = "flex";
    }

    // ------------------------------------------
    //  (A) ADD CATEGORY
    // ------------------------------------------
    if (event.target.id == "addCategory") {
      // Select the element to clone
      const categoryButton = document.querySelector('#categoryButton');    // The original "template" button
      const categoryPreview = document.querySelector('#categoryPreview');  // The original "template" preview in #categoryPreviewList

      if (categoryButton && categoryPreview) {
        // 1) Clone the category button
        const clonedButton = categoryButton.cloneNode(true);
        clonedButton.classList.remove('selected');
        clonedButton.querySelector(".dragsubcategory").style.display = "block";
        clonedButton.querySelector(".dragsubcategoryselect").style.display = "none";
        clonedButton.querySelector("div").innerText = "Category Name";
        clonedButton.style.display = "flex";

        // *** ADDED *** - Give this category button a unique ID
        const uniqueCategoryId = "cat-" + Date.now(); // e.g. "cat-167253..."
        clonedButton.id = uniqueCategoryId;           // So we can track it if needed

        // 2) Append the cloned button to .horizontal-category-div
        const targetDiv = document.querySelector('.horizontal-category-div');
        if (targetDiv) {
          targetDiv.appendChild(clonedButton);
        }

        // 3) Clone the category preview in #categoryPreviewList
        const clonedPreview = categoryPreview.cloneNode(true);
        clonedPreview.style.display = 'block';
        clonedPreview.innerText = "Category Name";
        const previewList = document.querySelector('#categoryPreviewList');
        if (previewList) {
          previewList.appendChild(clonedPreview);
        }

        // -------------------------------------
        // 4) Create a new subcategory container for this category
        //    (cloneNode(true) if you want the same children, or false for an empty container.)
        // -------------------------------------
        const newSubcategoryList = defaultSubcategoryList.cloneNode(true);
        // Remove its old ID so we don't have duplicates:
        newSubcategoryList.id = "subcategoryList-" + Date.now();
        // Hide it by default until user selects the new category
        newSubcategoryList.style.display = 'none';

        // Clear out any sub-subCategoryItems inside (if you want it empty):
        // or keep them if you prefer. Typically you'd want it empty:
        newSubcategoryList.innerHTML = defaultSubcategoryList.innerHTML;

        // Insert it somewhere in DOM:
        // For example, right after the defaultSubcategoryList or at the end of <body>.
        defaultSubcategoryList.parentNode.appendChild(newSubcategoryList);

        // -------------------------------------
        // 5) Create a new preview container for this category
        // -------------------------------------
        const newPreviewContainer = defaultPreviewContainer.cloneNode(true);
        newPreviewContainer.id = "previewContainer-" + Date.now();
        // Hide by default
        newPreviewContainer.style.display = 'none';

        // If you want it empty:
        newPreviewContainer.innerHTML = defaultPreviewContainer.innerHTML;

        // Insert it in DOM as well
        defaultPreviewContainer.parentNode.appendChild(newPreviewContainer);

        // -------------------------------------
        // 6) Link these containers to the new button via data attributes
        // -------------------------------------
        clonedButton.setAttribute("data-subcategory-list-id", newSubcategoryList.id);
        clonedButton.setAttribute("data-preview-container-id", newPreviewContainer.id);
      }
    }

    // ------------------------------------------
    //  (B) SELECT A CATEGORY BUTTON
    // ------------------------------------------
    if (event.target.classList.contains('text-block-361')) {
      // De-select all
      const buttons = document.querySelectorAll('.horizontal-category-div .category-button');
      buttons.forEach(button => {
        button.classList.remove('selected');
        button.querySelector(".dragsubcategory").style.display = "block";
        button.querySelector(".dragsubcategoryselect").style.display = "none";
      });

      // Select the clicked button
      const clickedButton = event.target.parentElement;
      clickedButton.classList.add('selected');
      clickedButton.querySelector(".dragsubcategory").style.display = "none";
      clickedButton.querySelector(".dragsubcategoryselect").style.display = "block";

      // Prefill category name text box
      const categoryNameInput = document.getElementById('categoryName');
      if (clickedButton.querySelector("div").innerText === "Category Name") {
        categoryNameInput.value = "";
      } else {
        categoryNameInput.value = clickedButton.querySelector("div").innerText;
      }

      // *** ADDED *** Show/hide subcategory + preview containers
      const allSubLists = document.querySelectorAll("[id^='subcategoryList']");
      const allPreviews = document.querySelectorAll("[id^='previewContainer']");

      // Hide all subcategory-lists & preview containers
      allSubLists.forEach(scl => scl.style.display = 'none');
      allPreviews.forEach(pv => pv.style.display = 'none');

      // Show only the subcategory-list + preview container of the clicked button
      const subcatId = clickedButton.getAttribute("data-subcategory-list-id");
      const previewId = clickedButton.getAttribute("data-preview-container-id");

      if (subcatId) {
        const subcatEl = document.getElementById(subcatId);
        if (subcatEl) subcatEl.style.display = 'flex';
      }
      if (previewId) {
        const previewEl = document.getElementById(previewId);
        if (previewEl) previewEl.style.display = 'flex';
      }
      // *** END ***
    }

    if(event.target.id == "submitAffiliatePage") {

      var affiliateData = {};

      affiliateData["productName"]

      //Create categories
      sendCategoriesToMake();

      //Create page
      sendAllDataToMake();
    }
  });

  async function sendProductsToMake() {

  }

  function createProductsAndSubCategory() {
    var products = [];



  }

  function clearSubCategoryPage() {
    document.getElementById("createSubCategoryName").value = "";
  
    // Select all product items
    var productItems = document.querySelectorAll("#productItem");
  
    // Convert NodeList to an array and iterate from the second element onward
    Array.from(productItems).forEach((item, index) => {
      if (index > 0) {
        item.remove();
      }
    });
  }
  

  // ---------------------------------------------
  // 6) ADDING SUBCATEGORY TO THE CURRENT CATEGORY
  // ---------------------------------------------
  function addSubCategoryToList() {
    const subCategoryName = document.getElementById('createSubCategoryName').value.trim();
    const productList = document.getElementById('productList');
    const productItems = productList.querySelectorAll('#productItem');
    const productCount = productItems.length - 1;

    if (productCount > 0) {
      // Original subCategoryItem template
      const subCategoryTemplate = document.getElementById('subCategoryItem');
      const clonedSubCategory = subCategoryTemplate.cloneNode(true);

      // Fill in the cloned subcategory fields
      clonedSubCategory.querySelector('#subCategoryName').textContent = subCategoryName || '{Subcategory Name}';
      clonedSubCategory.querySelector('#numberOfProducts').textContent = `${productCount} products`;

      // Update the thumbnail image if there's a valid source
      const firstProductImage = productItems[1]?.querySelector('#previewProductImage');
      const productImageSrc = firstProductImage ? firstProductImage.src : '';
      const thumbnail = clonedSubCategory.querySelector('#subCategoryThumbnail');
      if (productImageSrc && thumbnail) {
        const imageElement = document.createElement('img');
        imageElement.src = productImageSrc;
        imageElement.alt = 'Subcategory Thumbnail';
        imageElement.style.maxHeight = "72px";
        imageElement.style.maxWidth = "72px";
        imageElement.style.objectFit = "cover";
        imageElement.style.borderRadius = "8px";
        thumbnail.innerHTML = '';
        thumbnail.appendChild(imageElement);
      }

      // *** MODIFIED ***: Instead of appending to a global #subcategoryList,
      //                   append to the *selected category’s* subcategory list
      const selectedButton = document.querySelector('.category-button.selected');
      let subCategoryListContainer = document.getElementById('subcategoryList'); 
      // default fallback if no button is selected
      if (selectedButton) {
        const subcatId = selectedButton.getAttribute("data-subcategory-list-id");
        if (subcatId) {
          const scElem = document.getElementById(subcatId);
          if (scElem) subCategoryListContainer = scElem;
        }
      }

      clonedSubCategory.style.display = 'flex';
      subCategoryListContainer.appendChild(clonedSubCategory);

      // --- Fill and add the preview div ---
      const previewTemplate = document.querySelector('#subcategoryItemPreview');
      const clonedPreview = previewTemplate.cloneNode(true);

      // Fill in the preview fields
      clonedPreview.querySelector('#subCategoryNamePreview').textContent = subCategoryName || '{Subcategory #1 Name}';
      clonedPreview.querySelector('#numberOfProductsPreview').textContent = `${productCount} products`;

      // Clone and add images to the preview
      const previewImageContainer = clonedPreview.querySelector('.image-carousel');
      const productImages = productList.querySelectorAll('#previewProductImage');

      productImages.forEach((image) => {
        const previewImageClone = document.createElement('div');
        previewImageClone.className = 'div-block-676';
        
        const imgElement = document.createElement('img');
        imgElement.src = image.src;
        imgElement.alt = 'Subcategory Preview Image';
        imgElement.className = 'image-158';
        if (imgElement.src != "https://cdn.prod.website-files.com/627e2ab6087a8112f74f4ec5/677644eb2c765ddc16f695a2_Group%208654.avif") {
          previewImageClone.appendChild(imgElement);
          previewImageContainer.appendChild(previewImageClone);
        }
      });

      // Remove placeholder
      if (previewImageContainer.firstChild) {
        previewImageContainer.firstChild.remove();
      }

      // *** MODIFIED ***: Instead of appending to the global .div-block-684,
      //                   append to the *selected category’s* preview container
      let subCategoryPreviewContainer = document.querySelector('.div-block-684');
      if (selectedButton) {
        const previewId = selectedButton.getAttribute("data-preview-container-id");
        if (previewId) {
          const pvElem = document.getElementById(previewId);
          if (pvElem) subCategoryPreviewContainer = pvElem;
        }
      }

      clonedPreview.style.display = 'flex';
      subCategoryPreviewContainer.appendChild(clonedPreview);

      // Initialize Sortable for the new list
      new Sortable(subCategoryListContainer, {
        animation: 150,
        dragClass: "sortable-ghost",
        swapThreshold: 0.2,
        handle: "#categoryDrag",
        onEnd: function () {
          // Get the new order of subcategory names
          const subcategoryItems = Array.from(subCategoryListContainer.querySelectorAll(".sub-category-button"));
          const newOrder = subcategoryItems.map(item =>
            item.querySelector("#subCategoryName").textContent.trim()
          );

          // Get the corresponding preview container
          const previewItems = Array.from(subCategoryPreviewContainer.querySelectorAll("#subcategoryItemPreview"));

          // Map and reorder previews
          const reorderedPreviews = newOrder.map(subcategoryName => {
            return previewItems.find(preview =>
              preview.querySelector("#subCategoryNamePreview").textContent.trim() === subcategoryName
            );
          });

          // Clear and append reordered previews
          subCategoryPreviewContainer.innerHTML = '';
          reorderedPreviews.forEach(preview => {
            if (preview) subCategoryPreviewContainer.appendChild(preview);
          });
        }
      });
    }
  }

  // ---------------------------------------------
  // 7) ADDING PRODUCTS
  // ---------------------------------------------
  function cloneAndAddProduct() {
    var productLink = document.getElementById("affiliateProductLink").value;
    var productImage = document.getElementById("productPreviewImage").src;
    var productName = document.getElementById("productName").value;
    var productAffiliate = document.getElementById("affiliateDisplayText").value;

    var clonedItem = document.getElementById("productItem").cloneNode(true);

    var productLinkElement = clonedItem.querySelector("#productLink");
    if (productLinkElement) {
      productLinkElement.href = productLink; 
    }

    var previewImage = clonedItem.querySelector("#previewImage");
    var previewProductImage = clonedItem.querySelector("#previewProductImage");

    if (previewImage && previewProductImage) {
      previewImage.style.display = "none"; 
      previewProductImage.style.display = "block"; 
      previewProductImage.src = productImage; 
      previewProductImage.borderRadius = "8px"; 
    }

    var productTextElement = clonedItem.querySelector("#productText");
    if (productTextElement) {
      productTextElement.textContent = productName; 
    }

    var affiliateElement = clonedItem.querySelector("#productAffiliate");
    if (affiliateElement) {
      affiliateElement.textContent = "Affiliate Code: " + productAffiliate; 
    }

    clonedItem.style.display = "flex";
    document.getElementById("productList").appendChild(clonedItem);

    clearProductForm();
  }

  // ---------------------------------------------
  // 8) CLEAR PRODUCT FORM
  // ---------------------------------------------
  function clearProductForm() {
    const productPreviewImage = document.getElementById('productPreviewImage');
    const previewImageText = document.getElementById('previewImageText');

    productPreviewImage.style.display = 'none';
    previewImageText.style.display = 'flex';

    document.getElementById("affiliateProductLink").value = '';
    document.getElementById("affiliateDisplayText").value = '';
    document.getElementById("workoutThumbnailSelect").value = '';
    document.getElementById("createProductModal").style.display = "none";
  }


  // ---------------------------------------------
  // 9) GET PREVIEW IMAGE
  // ---------------------------------------------
  async function getPreviewImage(url) {
    try {
      const response = await fetch(url);
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // Check Open Graph or Twitter meta tags, or fall back to the first img
      let imageSrc =
        doc.querySelector('meta[property="og:image"]')?.content ||
        doc.querySelector('meta[name="twitter:image"]')?.content ||
        doc.querySelector('img')?.src;

      return imageSrc ? imageSrc : null;
    } catch (error) {
      console.error('Error fetching preview image:', error);
      return null;
    }
  }

  // ---------------------------------------------
  // 10) GET PAGE TITLE
  // ---------------------------------------------
  async function getPageTitle(url) {
    try {
      const response = await fetch(url);
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // Check og:title, twitter:title, or <title>
      const title =
        doc.querySelector('meta[property="og:title"]')?.content ||
        doc.querySelector('meta[name="twitter:title"]')?.content ||
        doc.querySelector('title')?.textContent;

      return title ? title.trim() : null;
    } catch (error) {
      console.error('Error fetching page title:', error);
      return null;
    }
  }
}
