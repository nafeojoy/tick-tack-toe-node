require("babel-register");

let server = require('./server.conf');
let chai = require('chai')
let chaiHttp = require('chai-http');

chai.should();

chai.use(chaiHttp);

describe('Task API', () => {
    it("It should GET all Matches", (done) => {
        chai.request('http://localhost:4000')
            .get("/api/get-games")
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.be.a('array');
                done();
            })
    })
})