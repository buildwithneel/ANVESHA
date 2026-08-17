import math
import numpy as np
from typing import List, Dict, Any, Tuple

def compute_iou(boxA: List[int], boxB: List[int]) -> float:
    """Calculates Intersection over Union (IoU) between two bounding boxes [x1, y1, x2, y2]."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    if interArea == 0:
        return 0.0

    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

    iou = interArea / float(boxAArea + boxBArea - interArea)
    return iou


def compute_center_distance(boxA: List[int], boxB: List[int]) -> float:
    """Calculates Euclidean distance between centers of two bounding boxes [x1, y1, x2, y2]."""
    cxA = (boxA[0] + boxA[2]) / 2.0
    cyA = (boxA[1] + boxA[3]) / 2.0
    cxB = (boxB[0] + boxB[2]) / 2.0
    cyB = (boxB[1] + boxB[3]) / 2.0
    return float(math.sqrt((cxA - cxB) ** 2 + (cyA - cyB) ** 2))


def get_max_center_distance_threshold(
    boxA: List[int],
    boxB: List[int],
    dist_factor: float = 1.2,
    min_pixels: float = 60.0,
    max_pixels: float = 250.0
) -> float:
    """
    Computes a scale-aware maximum allowed center distance threshold based on 
    the max dimension (width or height) of the two bounding boxes.
    """
    wA, hA = max(1, boxA[2] - boxA[0]), max(1, boxA[3] - boxA[1])
    wB, hB = max(1, boxB[2] - boxB[0]), max(1, boxB[3] - boxB[1])
    max_dim = max(wA, hA, wB, hB)
    scaled_thresh = max_dim * dist_factor
    return max(min_pixels, min(max_pixels, scaled_thresh))


class Track:
    """Represents a single tracked object state in ByteTrack."""
    def __init__(self, track_id: int, bbox: List[int], score: float, cls_name: str = "person"):
        self.track_id = track_id
        self.bbox = bbox
        self.score = score
        self.class_name = cls_name
        self.disappeared = 0
        self.state = "tracked"  # 'tracked' or 'lost'


class ByteTracker:
    """
    ByteTrack Engine for multi-object person tracking with Center-Distance Fallback.
    Employs a multi-stage association algorithm:
      1. Primary Stage 1: High-confidence IoU association.
      2. Primary Stage 2: Low-confidence IoU association (occlusion recovery).
      3. Fallback Stage 3: Scale-aware center-distance Euclidean matching for 
         unmatched high-confidence detections to prevent unnecessary ID loss/switching.
    """
    def __init__(
        self,
        high_thresh: float = 0.40,
        low_thresh: float = 0.15,
        match_thresh: float = 0.20,
        max_disappeared: int = 30,
        dist_factor: float = 1.2
    ):
        self.next_track_id = 1
        self.tracked_objects: Dict[int, Track] = {}
        self.high_thresh = high_thresh
        self.low_thresh = low_thresh
        self.match_thresh = match_thresh
        self.max_disappeared = max_disappeared
        self.dist_factor = dist_factor
        print(f"[TRACKER] ByteTrack engine with Center-Distance Fallback initialized (high_thresh={high_thresh}, low_thresh={low_thresh}, max_disappeared={max_disappeared}, dist_factor={dist_factor})")

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Updates tracked objects using multi-stage IoU and Center-Distance association.
        Adds `track_id` to each assigned detection and returns updated detection list.
        """
        if not detections and not self.tracked_objects:
            return []

        # 1. Separate detections into high-confidence and low-confidence pools
        high_dets = []
        low_dets = []
        for det in detections:
            conf = det.get("confidence", 1.0)
            if conf >= self.high_thresh:
                high_dets.append(det)
            elif conf >= self.low_thresh:
                low_dets.append(det)

        track_ids = list(self.tracked_objects.keys())
        assigned_track_ids = set()
        assigned_high_det_indices = set()
        updated_detections = []

        # 2. STAGE 1: Match high-confidence detections with active tracks using IoU
        for d_idx, det in enumerate(high_dets):
            best_iou = 0.0
            best_tid = None
            for tid in track_ids:
                if tid in assigned_track_ids:
                    continue
                track = self.tracked_objects[tid]
                iou = compute_iou(det["bbox"], track.bbox)
                if iou > best_iou:
                    best_iou = iou
                    best_tid = tid

            if best_iou >= self.match_thresh and best_tid is not None:
                det["track_id"] = best_tid
                track = self.tracked_objects[best_tid]
                track.bbox = det["bbox"]
                track.score = det.get("confidence", 1.0)
                track.disappeared = 0
                track.state = "tracked"
                assigned_track_ids.add(best_tid)
                assigned_high_det_indices.add(d_idx)
                updated_detections.append(det)

        # 3. STAGE 2: Match remaining unmatched active tracks with low-confidence detections (Occlusion Recovery) using IoU
        unmatched_track_ids = [tid for tid in track_ids if tid not in assigned_track_ids]
        for det in low_dets:
            best_iou = 0.0
            best_tid = None
            for tid in unmatched_track_ids:
                if tid in assigned_track_ids:
                    continue
                track = self.tracked_objects[tid]
                iou = compute_iou(det["bbox"], track.bbox)
                if iou > best_iou:
                    best_iou = iou
                    best_tid = tid

            if best_iou >= self.match_thresh and best_tid is not None:
                det["track_id"] = best_tid
                track = self.tracked_objects[best_tid]
                track.bbox = det["bbox"]
                track.score = det.get("confidence", 0.5)
                track.disappeared = 0
                track.state = "tracked"
                assigned_track_ids.add(best_tid)
                updated_detections.append(det)

        # 4. STAGE 3: Center-Distance Fallback Matching for unmatched high-confidence detections
        # Prevents ID flickering when IoU drops due to fast movement or temporary occlusion
        fallback_candidates = []
        for d_idx, det in enumerate(high_dets):
            if d_idx in assigned_high_det_indices:
                continue
            for tid in track_ids:
                if tid in assigned_track_ids:
                    continue
                track = self.tracked_objects[tid]
                dist = compute_center_distance(det["bbox"], track.bbox)
                max_dist = get_max_center_distance_threshold(det["bbox"], track.bbox, dist_factor=self.dist_factor)
                if dist <= max_dist:
                    fallback_candidates.append((dist, d_idx, tid))

        # Sort candidates by distance (closest pairs first)
        fallback_candidates.sort(key=lambda x: x[0])

        # Greedily match closest valid candidate pairs
        for dist, d_idx, tid in fallback_candidates:
            if d_idx in assigned_high_det_indices or tid in assigned_track_ids:
                continue
            det = high_dets[d_idx]
            det["track_id"] = tid
            track = self.tracked_objects[tid]
            track.bbox = det["bbox"]
            track.score = det.get("confidence", 1.0)
            track.disappeared = 0
            track.state = "tracked"
            assigned_track_ids.add(tid)
            assigned_high_det_indices.add(d_idx)
            updated_detections.append(det)

        # 5. Increment disappeared counter for unmatched tracks
        for tid in track_ids:
            if tid not in assigned_track_ids:
                self.tracked_objects[tid].disappeared += 1
                self.tracked_objects[tid].state = "lost"
                if self.tracked_objects[tid].disappeared > self.max_disappeared:
                    del self.tracked_objects[tid]

        # 6. STAGE 4: Register new tracks for remaining unmatched high-confidence detections
        for d_idx, det in enumerate(high_dets):
            if d_idx not in assigned_high_det_indices:
                tid = self.next_track_id
                self.next_track_id += 1
                det["track_id"] = tid
                self.tracked_objects[tid] = Track(
                    track_id=tid,
                    bbox=det["bbox"],
                    score=det.get("confidence", 1.0),
                    cls_name=det.get("class", "person")
                )
                updated_detections.append(det)

        return updated_detections

# Alias for backward compatibility
LightweightTracker = ByteTracker


