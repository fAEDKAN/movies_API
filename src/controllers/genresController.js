const { Op } = require("sequelize");
const db = require("../database/models");
const { createError } = require("../helpers");

module.exports = {
    list: async (req, res) => {
        let { limit, order = "id" } = req.query;
        let fields = ["name", "ranking"];

        try {
            if (!fields.includes(order)) {
                throw createError(
                    400,
                    "Sólo se puede ordenar por 'name' o 'ranking'"
                );
            }

            let total = await db.Genre.count();
            let genres = await db.Genre.findAll({
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
                limit: limit ? +limit : 5,
                order: [order],
            });

            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200,
                },
                data: {
                    items: genres.length,
                    total,
                    genres,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(error.status || 500).json({
                ok: false,
                msg: error.message,
            });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;

        try {
            if (isNaN(id)) {
                throw createError(400, "El ID debe ser un número"); //aplicamos una validación para ver si el ID es o no es un número, de ésta forma evitamos que el código se ejecute inútilmente
            }

            let genre = await db.Genre.findByPk(id);

            if (!genre) {
                throw createError(400, "No existe un género con ese ID");
            }
            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200,
                },
                data: {
                    genre,
                    total: 1,
                },
            });
        } catch (error) {
            // agarra el error enviado con throw
            console.log(error);
            return res.status(error.status || 500).json({
                ok: false,
                msg: error.message,
            });
        }
    },

    getByName: async (req, res) => {
        const { name } = req.params;

        try {
            if (!name) {
                throw createError(400, "El nombre es obligatorio");
            }

            let genre = await db.Genre.findOne({
                where: {
                    name: {
                        [Op.substring]: name,
                    },
                },
            });

            if (!genre) {
                throw createError(
                    400,
                    "No se encuentra un género con ese nombre"
                );
            }
            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200,
                },
                data: {
                    genre,
                    total: 1,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(error.status || 500).json({
                ok: false,
                msg: error.message,
            });
        }
    },
};
