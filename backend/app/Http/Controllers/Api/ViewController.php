<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ViewController extends Controller
{
    public function workspaceData(Request $request, Workspace $workspace): JsonResponse
    {
        abort_unless($workspace->members()->where('users.id', $request->user()->id)->exists(), 403);

        $workspace->load(['spaces.tasks' => fn ($q) => $q->with('subtasks')->orderBy('position')]);

        return response()->json([
            'workspace' => $workspace,
            'board' => $workspace->spaces->map(fn ($space) => [
                'id' => $space->id,
                'name' => $space->name,
                'tasks' => $space->tasks->whereNull('parent_id')->values(),
            ]),
            'calendar' => $workspace->spaces->flatMap(fn ($space) => $space->tasks)
                ->whereNotNull('due_date')
                ->values(),
            'gantt' => $workspace->spaces->flatMap(fn ($space) => $space->tasks)
                ->whereNotNull('start_date')
                ->whereNotNull('due_date')
                ->values(),
        ]);
    }
}
