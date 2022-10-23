const objectValidate = (args, msg) => ({
   args,
   msg,
});

const defaultValidations = {
   notNull: objectValidate(true, "No puede ser nulo"),
   notEmpty: objectValidate(true, "El valor es requerido"),
};

module.exports = {
   objectValidate,
   defaultValidations,
};
