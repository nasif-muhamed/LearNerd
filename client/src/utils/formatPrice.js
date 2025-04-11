// Function to format price to Indian Rupee
const formatPrice = (price) => {
    return `₹${price.toLocaleString()}`;
};

export default formatPrice