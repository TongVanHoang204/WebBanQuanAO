import swaggerJsdoc from 'swagger-jsdoc';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Fashion Store API',
            version: '1.0.0',
            description: 'API documentation for Fashion Store E-commerce Backend',
            contact: {
                name: 'Developer',
            },
        },
        servers: [
            {
                url: 'http://localhost:4000/api',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};
export const specs = swaggerJsdoc(options);
//# sourceMappingURL=swagger.js.map