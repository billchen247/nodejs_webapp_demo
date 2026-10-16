import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ["student"],
            default: "student",
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform(_doc, ret: Record<string, unknown>) {
                ret.id = String(ret._id);
                delete ret._id;
                delete ret.passwordHash;
            },
        },
    },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;

export const UserModel = model<User>("User", userSchema);
