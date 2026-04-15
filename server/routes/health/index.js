
export default async function healthRoutes(fastify){
    fastify.get('/health', async (request, reply ) => {
        return {
            status: 'ok',
            uptime:process.uptime(),
            timestamp: Date.now()
        }
    })
}