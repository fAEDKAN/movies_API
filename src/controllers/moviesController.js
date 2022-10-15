const path = require("path");
const db = require("../database/models");
const { Op } = require("sequelize");
const moment = require("moment");
const { createError, getUrl, getUrlBase } = require("../helpers");

//Aquí tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;

module.exports = {
    list: async (req, res) => {
        const { limit, order, offset } = req.query;
        let fields = ["title", "ranking", "release_date", "length", "awards"];

        try {
            if (order && !fields.includes(order)) {
                throw createError(
                    400,
                    `Sólo se puede ordenar por ${fields.join(", ")}`
                );
            }

            let total = await db.Movie.count();
            let movies = await db.Movie.findAll({
                attributes: {
                    exclude: ["created_at", "updated_at"],
                },
                include: [
                    {
                        association: "genre",
                        attributes: {
                            exclude: ["created_at", "updated_at"],
                        },
                    },
                    {
                        association: "actors",
                        attributes: {
                            exclude: ["created_at", "updated_at"],
                        },
                    },
                ],
                limit: limit ? +limit : 5,
                offset: offset ? +offset : 0,
                order: [order ? order : "id"],
            });

            movies.forEach((movie) => {
                movie.setDataValue("link", `${getUrl(req)}/${movie.id}`);
            });

            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200,
                },
                data: {
                    items: movies.length,
                    total,
                    movies,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                msg: error.message,
            });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;

        try {
            if (isNaN(id)) {
                throw createError(400, "El ID debe ser un número");
            }
            const movie = await db.Movie.findByPk(req.params.id, {
                include: [
                    {
                        association: "genre",
                        attributes: {
                            exclude: ["created_at", "updated_at", "genre_id"],
                        },
                    },
                    {
                        association: "actors",
                        attributes: {
                            exclude: ["created_at", "updated_at"],
                        },
                    },
                ],
                attributes: {
                    exclude: ["created_at", "updated_at", "genre_id"],
                },
            });

            if (!movie) {
                throw createError(400, "No existe una película con ese ID");
            }

            movie.release_date = moment(movie.release_date).format(
                "DD-MM-YYYY"
            );

            console.log(getUrl(req.originalUrl));

            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200,
                },
                data: {
                    movie,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                msg: error.message,
            });
        }
    },

    newest: async (req, res) => {
        const { limit } = req.query;

        const options = {
            include: [
                {
                    association: "genre",
                    attributes: {
                        exclude: ["created_at", "updated_at"],
                    },
                },
                {
                    association: "actors",
                    attributes: {
                        exclude: ["created_at", "updated_at"],
                    },
                },
            ],
            attributes: {
                exclude: ["created_at", "updated_at"],
            },
            limit: limit ? +limit : 5,
            order: [["release_date", "DESC"]],
        };

        try {
            const movies = await db.Movie.findAll(options);

            const moviesModify = movies.map((movie) => {
                return {
                    ...movie.dataValues,
                    link: `${getUrlBase(req)}/${movie.id}`,
                };
            });

            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200,
                },
                data: {
                    movies: moviesModify,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                msg: error.message,
            });
        }
    },

    recommended: (req, res) => {
        db.Movie.findAll({
            include: ["genre"],
            where: {
                rating: { [db.Sequelize.Op.gte]: 8 },
            },
            order: [["rating", "DESC"]],
        }).then((movies) => {
            res.render("recommendedMovies.ejs", { movies });
        });
    },
    //Aquí dispongo las rutas para trabajar con el CRUD
    create: async (req, res) => {
        const { title, rating, awards, release_date, length, genre_id } =
            req.body;

        let errors = [];

        try {
            for (const key in req.body) {
                if (!req.body[key]) {
                    errors = [
                        ...errors,
                        {
                            field: key,
                            msg: `El campo ${key} es obligatorio`,
                        },
                    ];
                }
            }

            if (errors.length) {
                throw createError(400, "Ups... Hay errores");
            }

            const movie = await db.Movie.create({
                title: title?.trim(),
                rating,
                awards,
                release_date,
                length,
                genre_id,
            });

            return res.status(201).json({
                ok: true,
                meta: {
                    status: 201,
                },
                data: {
                    movie,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                msg: error.message,
            });
        }
    },

    update: function (req, res) {
        let movieId = req.params.id;
        Movies.update(
            {
                title: req.body.title,
                rating: req.body.rating,
                awards: req.body.awards,
                release_date: req.body.release_date,
                length: req.body.length,
                genre_id: req.body.genre_id,
            },
            {
                where: { id: movieId },
            }
        )
            .then(() => {
                return res.redirect("/movies");
            })
            .catch((error) => res.send(error));
    },

    destroy: function (req, res) {
        let movieId = req.params.id;
        Movies.destroy({ where: { id: movieId }, force: true }) // force: true es para asegurar que se ejecute la acción
            .then(() => {
                return res.redirect("/movies");
            })
            .catch((error) => res.send(error));
    },
};
