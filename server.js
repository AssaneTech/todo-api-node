import http from "http";
import { parse } from "url";

let todos = [];
let idCounter = 1;

// Helper: send response
function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

// Helper: read request body
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject("Invalid JSON");
            }
        });
    });
}

const server = http.createServer(async (req, res) => {

    const parsedUrl = parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // GET ALL TODOS
    if (path === "/todos" && method === "GET") {
        return sendResponse(res, 200, todos);
    }

    // CREATE TODO
    if (path === "/todos" && method === "POST") {

        try {
            const body = await getRequestBody(req);

            if (!body.title) {
                return sendResponse(res, 400, { error: "Title is required" });
            }

            const newTodo = {
                id: idCounter++,
                title: body.title,
                completed: body.completed || false
            };

            todos.push(newTodo);

            return sendResponse(res, 201, newTodo);

        } catch (error) {
            return sendResponse(res, 400, { error });
        }
    }

    // GET TODO BY ID
    if (path.startsWith("/todos/") && method === "GET") {

        const id = parseInt(path.split("/")[2]);

        const todo = todos.find(t => t.id === id);

        if (!todo) {
            return sendResponse(res, 404, { error: "Todo not found" });
        }

        return sendResponse(res, 200, todo);
    }

    // UPDATE TODO
    if (path.startsWith("/todos/") && method === "PUT") {

        try {
            const id = parseInt(path.split("/")[2]);
            const todo = todos.find(t => t.id === id);

            if (!todo) {
                return sendResponse(res, 404, { error: "Todo not found" });
            }

            const body = await getRequestBody(req);

            if (body.title !== undefined) todo.title = body.title;
            if (body.completed !== undefined) todo.completed = body.completed;

            return sendResponse(res, 200, todo);

        } catch (error) {
            return sendResponse(res, 400, { error });
        }
    }

    // DELETE TODO
    if (path.startsWith("/todos/") && method === "DELETE") {

        const id = parseInt(path.split("/")[2]);
        const index = todos.findIndex(t => t.id === id);

        if (index === -1) {
            return sendResponse(res, 404, { error: "Todo not found" });
        }

        todos.splice(index, 1);

        return sendResponse(res, 204, { message: "Deleted" });
    }

    // ROUTE NOT FOUND
    sendResponse(res, 404, { error: "Route not found" });

});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
