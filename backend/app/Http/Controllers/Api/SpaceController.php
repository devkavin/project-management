<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Space;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpaceController extends Controller
{
    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorizeMembership($request, $workspace);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:10'],
        ]);

        $space = $workspace->spaces()->create($data);

        return response()->json($space, 201);
    }

    public function show(Request $request, Space $space): JsonResponse
    {
        $this->authorizeMembership($request, $space->workspace);

        return response()->json($space->load(['tasks.subtasks', 'workspace']));
    }

    public function update(Request $request, Space $space): JsonResponse
    {
        $this->authorizeMembership($request, $space->workspace);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:10'],
        ]);

        $space->update($data);

        return response()->json($space);
    }

    public function destroy(Request $request, Space $space): JsonResponse
    {
        $this->authorizeMembership($request, $space->workspace);
        $space->delete();

        return response()->json(status: 204);
    }

    private function authorizeMembership(Request $request, Workspace $workspace): void
    {
        abort_unless($workspace->members()->where('users.id', $request->user()->id)->exists(), 403);
    }
}
