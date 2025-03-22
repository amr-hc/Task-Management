import mongoose, { Document, ObjectId, Schema } from 'mongoose';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export interface ITask extends Document {
  _id: ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    dueDate: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
