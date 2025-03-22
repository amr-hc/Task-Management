import mongoose, { Schema, Document } from 'mongoose';

export interface IUserTask extends Document {
  userId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
}

const userTaskSchema = new Schema<IUserTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  },
  { timestamps: true }
);

userTaskSchema.index({ userId: 1, taskId: 1 }, { unique: true });
userTaskSchema.index({ taskId: 1 });

export const UserTask = mongoose.model<IUserTask>('UserTask', userTaskSchema);
