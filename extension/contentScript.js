
(async function () {
  const findElementByXPath = (xpath) => {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  };

  try {
    const inputXPath = '//*[@id="root"]/div/input';  
    const buttonXPath = '//*[@id="root"]/div/button';  

    const inputElement = findElementByXPath(inputXPath);
    const buttonElement = findElementByXPath(buttonXPath);

    if (inputElement && buttonElement) {

      const imagePath = 'D:/Captcha/yolo+cnn/yolo+cnn/playground/backend/captcha.png'; 
      const response = await fetch('http://localhost:5000/predict_captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_path: imagePath }),
      });

      const data = await response.json();

      if (data.captcha_text) {
        inputElement.value = data.captcha_text;
        console.log("Predicted text inserted: " + data.captcha_text);

        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);

        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);

        await new Promise(resolve => setTimeout(resolve, 500));

        buttonElement.click();
        console.log("Button clicked.");
      } else {
        console.error("Error getting CAPTCHA text:", data.error);
      }
    } else {
      console.error("Input or button not found using the specified XPath.");
    }
  } catch (error) {
    console.error("Error occurred while automating the process:", error);
  }
})();
