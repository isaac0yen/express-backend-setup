import { Request, Response } from 'express';
import { CreateUserRequest } from '../types/user.controller';
import Validate from '../modules/validate';
import bcrypt from 'bcrypt';
import { db } from '../modules/database';
import { AuthenticatedRequest } from '../middlewares/auth';

export default {
  createUser: async (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
    try {
      const { email, password, first_name, last_name, gender, role, country, profile_image, date_of_birth } = req.body;

      if (!Validate.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      if (!Validate.isString(password) || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      if (!Validate.isString(first_name)) {
        return res.status(400).json({ message: "First name is required" });
      }
      if (!Validate.isString(last_name)) {
        return res.status(400).json({ message: "Last name is required" });
      }
      if (!Validate.isEnum(gender, ['MALE', 'FEMALE', 'RATHER_NOT_SAY'])) {
        return res.status(400).json({ message: "Invalid Gender" });
      }
      if (!Validate.isEnum(role, ['ROLE', 'FACILITATOR', 'STUDENT', 'ADMIN', 'SUPER_ADMIN'])) {
        return res.status(400).json({ message: "Invalid Role" });
      }
      if (!Validate.isString(country)) {
        return res.status(400).json({ message: "Country is required" });
      }
      if (!Validate.isUrl(profile_image)) {
        return res.status(400).json({ message: "Invalid profile image URL" });
      }
      if (!Validate.isDate(date_of_birth)) {
        return res.status(400).json({ message: "Invalid date of birth" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertedUser = await db.insertOne('users', {
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        gender,
        role,
        country,
        profile_image,
        date_of_birth
      });

      if (!insertedUser) {
        return res.status(500).json({ message: "Error inserting user into database" });
      }

      return res.status(201).json({ status: true, message: "User created successfully" });

    } catch (error) {
      res.status(500).json({ message: "Error creating user", error });
    }
  },

  getUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.context!;
      const user = await db.findOne('users', { id: id });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      delete user.password_hash;
      return res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  },

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = await db.findMany('users', {});
      users.forEach(user => delete user.password_hash);
      return res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  },

  updateUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.context!;
      const updateData: any = {};
      const { email, password, first_name, last_name, gender, role, country, profile_image, date_of_birth } = req.body;

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "No update data provided" });
      }

      if (email !== undefined) {
        if (!Validate.isEmail(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
        updateData.email = email;
      }

      if (password !== undefined) {
        if (!Validate.isString(password) || password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        updateData.password_hash = await bcrypt.hash(password, 10);
      }

      if (first_name !== undefined) {
        if (!Validate.isString(first_name)) {
          return res.status(400).json({ message: "First name must be a string" });
        }
        updateData.first_name = first_name;
      }

      if (last_name !== undefined) {
        if (!Validate.isString(last_name)) {
          return res.status(400).json({ message: "Last name must be a string" });
        }
        updateData.last_name = last_name;
      }

      if (gender !== undefined) {
        if (!Validate.isEnum(gender, ['MALE', 'FEMALE', 'RATHER_NOT_SAY'])) {
          return res.status(400).json({ message: "Invalid Gender" });
        }
        updateData.gender = gender;
      }

      if (role !== undefined) {
        if (!Validate.isEnum(role, ['ROLE', 'FACILITATOR', 'STUDENT', 'ADMIN', 'SUPER_ADMIN'])) {
          return res.status(400).json({ message: "Invalid Role" });
        }
        updateData.role = role;
      }

      if (country !== undefined) {
        if (!Validate.isString(country)) {
          return res.status(400).json({ message: "Country must be a string" });
        }
        updateData.country = country;
      }

      if (profile_image !== undefined) {
        if (!Validate.isUrl(profile_image)) {
          return res.status(400).json({ message: "Invalid profile image URL" });
        }
        updateData.profile_image = profile_image;
      }

      if (date_of_birth !== undefined) {
        if (!Validate.isDate(date_of_birth)) {
          return res.status(400).json({ message: "Invalid date of birth" });
        }
        updateData.date_of_birth = date_of_birth;
      }

      const updatedRows = await db.updateOne('users', updateData, { id: id });

      if (updatedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error });
    }
  },

  deleteUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.context!;
      const deletedRows = await db.updateOne('users', { status: "DELETED" }, { id: id });

      if (deletedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  }
};