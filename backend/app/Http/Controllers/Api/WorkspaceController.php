<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaces = $request->user()->workspaces()->withCount('spaces')->latest()->get();

        return response()->json($workspaces);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $workspace = Workspace::create([...$data, 'owner_id' => $request->user()->id]);
        $workspace->members()->attach($request->user()->id, ['role' => 'owner']);

        return response()->json($workspace->load('members'), 201);
    }

    public function show(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorizeMembership($request, $workspace);

        return response()->json($workspace->load(['spaces.tasks.subtasks', 'members']));
    }

    public function update(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorizeMembership($request, $workspace);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $workspace->update($data);

        return response()->json($workspace);
    }

    public function destroy(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorizeMembership($request, $workspace);
        $workspace->delete();

        return response()->json(status: 204);
    }

    private function authorizeMembership(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->members()->where('users.id', $request->user()->id)->exists(), 403);
    }
}
