
module.exports = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  saId: /^\d{13}$/,
  
  accountNumber: /^\d{8,16}$/,
  
  swift: /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/,
  
  currency: /^[A-Z]{3}$/,
  
  amountCents: /^\d+$/,
  
  fullName: /^[A-Za-z][A-Za-z '\-]{1,148}[A-Za-z]$/,
  
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=]{8,72}$/
};
