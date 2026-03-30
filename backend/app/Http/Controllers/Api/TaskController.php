<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Space;
use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(Request $request, Space $space): JsonResponse
    {
        $this->authorizeMembership($request, $space->workspace);

        $task = $space->tasks()->create($this->payload($request));

        return response()->json($task->load('subtasks'), 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorizeMembership($request, $task->space->workspace);
        $task->update($this->payload($request, true));

        return response()->json($task->fresh()->load('subtasks'));
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorizeMembership($request, $task->space->workspace);
        $task->delete();

        return response()->json(status: 204);
    }

    private function payload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:tasks,id'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'in:todo,in_progress,done'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'progress' => ['nullable', 'integer', 'between:0,100'],
            'position' => ['nullable', 'integer'],
        ]);
    }

    private function authorizeMembership(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->members()->where('users.id', $request->user()->id)->exists(), 403);
    }
}
