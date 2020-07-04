import React, { useState, useRef } from "react";
import "./CommentSection.scss";
import { useComments, useUser, firestore, updateComment } from "util/db";
import { formatDate } from "util/date";

const loadingState = {
  delete: "Delete",
  edit: "Edit",
  comment: "Comment",
};
const CommentCell = ({ comment }) => {
  const { data: authorData } = useUser(comment.owner);
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const editComment = () => setEditMode(true);
  const deleteComment = async () => {
    if (!!loading) {
      return;
    }

    setLoading(loadingState.delete);

    try {
      await firestore
        .doc(["works", comment.workId, "comments", comment.id].join("/"))
        .delete();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleSubmit = async (event) => {
    event && event.preventDefault();
    const text = inputRef.current && inputRef.current.value;

    if (!(text && !!text.length)) {
      deleteComment();
      return;
    }
    inputRef.current.value = "";

    try {
      setLoading(loadingState.edit);
      setEditMode(false);
      await updateComment({
        workId: comment.workId,
        text,
        commentId: comment.id,
      });
    } catch (error) {
      setEditMode(true);
      console.error(error);
      inputRef.current.value = text;
    } finally {
      setLoading(null);
    }
  };

  const handleEnterPressOnInput = (e) => {
    if (e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="comment-row">
      {authorData ? (
        <img src={authorData.photoURL} alt={authorData.displayName} />
      ) : (
        <div />
      )}
      <div>
        {authorData && (
          <div className="comment-header">
            <strong>{authorData.displayName}</strong>
          </div>
        )}
        {!editMode && <p className="comment-content">{comment.text}</p>}
        {!!editMode && (
          <form className="edit-input-wrapper" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              defaultValue={comment.text}
              onKeyDown={handleEnterPressOnInput}
              className={`textarea comment-input`}
              placeholder="Share your thoughts on this project"
            ></textarea>
            <button
              className="primary-action"
              type="submit"
              className={`button is-primary ${
                loading === loadingState.edit ? "is-loading" : ""
              }`}
            >
              Update
            </button>
          </form>
        )}
        <div className="comment-actions">
          <a
            className=" comment-action-btn"
            role="button"
            onClick={editComment}
          >
            Edit
          </a>
          <a
            className={`delete-btn comment-action-btn ${
              loading === loadingState.delete ? "is-loading" : ""
            }`}
            role="button"
            onClick={deleteComment}
          >
            Delete
          </a>
          {comment.created && (
            <small className="timestamp">
              {formatDate(comment.created.seconds * 1000)}
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

const CommentSection = ({ workId }) => {
  const { data } = useComments(workId);
  return (
    <div className="comment-section">
      {data &&
        data.map((comment) => (
          <CommentCell key={comment.id} comment={comment} />
        ))}
    </div>
  );
};

export default CommentSection;
