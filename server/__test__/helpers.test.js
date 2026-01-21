// Letakkan di baris paling atas (sebelum require helper)
process.env.JWT_SECRET = 'rahasia_untuk_test'; 
const { signToken, verifyToken } = require('../helpers/jwt');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const jwt = require('jsonwebtoken');


describe('Helpers Testing', () => {
    
    describe('Bcrypt Helper', () => {
        const password = 'password123';
        let hashed;

        it('should hash password correctly', () => {
            hashed = hashPassword(password);
            expect(hashed).not.toBe(password);
            expect(hashed).toBeDefined();
        });

        it('should return true for valid password', () => {
            const isValid = comparePassword(password, hashed);
            expect(isValid).toBe(true);
        });

        it('should return false for invalid password', () => {
            const isValid = comparePassword('wrongpass', hashed);
            expect(isValid).toBe(false);
        });
    });

    describe('JWT Helper', () => {
        const payload = { id: 1, role: 'Admin' };
        let token;

        it('should sign token correctly', () => {
            token = signToken(payload);
            expect(token).toBeDefined();
            const decoded = jwt.decode(token);
            expect(decoded.id).toBe(payload.id);
        });

        it('should verify token correctly', () => {
            const verified = verifyToken(token);
            expect(verified.id).toBe(payload.id);
        });
    });
});