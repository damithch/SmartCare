import request from "supertest";
import app from "../../src/app.js";

describe("Health route", () => {
  it("GET /api/v1/health should return 200", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String)
      })
    );
  });
});
