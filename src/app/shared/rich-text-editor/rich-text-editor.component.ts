import {
  AfterViewInit,
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * Headless rich-text editor built on TipTap (ProseMirror).
 *
 * Implements {@link ControlValueAccessor} so it integrates with Angular reactive
 * forms and template-driven forms identically to a native input.
 * The value type is an HTML string (TipTap's getHTML() output).
 * An empty editor emits '' so that required-field validation works correctly.
 *
 * Supported formatting:
 *   Bold · Italic · Link · Bullet list · Ordered list
 *   (plus keyboard shortcuts provided by StarterKit: Ctrl+B, Ctrl+I, etc.)
 *
 * Reusable across domains: CRM outreach, support-ticket replies, internal notes.
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
})
export class RichTextEditorComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  /** Placeholder text shown inside the editor when empty. */
  @Input() placeholder = 'Write your message…';

  @ViewChild('editorEl') private editorEl!: ElementRef<HTMLDivElement>;

  private editor?: Editor;

  /**
   * Holds a value received via writeValue() before the editor is ready.
   * Applied once in ngAfterViewInit and then cleared.
   */
  private pendingValue: string | null = null;

  // ── Toolbar reactive state ───────────────────────────────────────────────

  readonly isBold        = signal(false);
  readonly isItalic      = signal(false);
  readonly isBulletList  = signal(false);
  readonly isOrderedList = signal(false);
  readonly isLink        = signal(false);

  // ── ControlValueAccessor callbacks ───────────────────────────────────────

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void             = () => {};

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({ placeholder: this.placeholder }),
      ],
      onUpdate: ({ editor }) => {
        this.onChange(editor.isEmpty ? '' : editor.getHTML());
        this.syncToolbar(editor);
      },
      onSelectionUpdate: ({ editor }) => this.syncToolbar(editor),
      onBlur: () => this.onTouched(),
    });

    if (this.pendingValue !== null) {
      this.editor.commands.setContent(this.pendingValue);
      this.pendingValue = null;
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  // ── ControlValueAccessor ─────────────────────────────────────────────────

  writeValue(value: string): void {
    if (this.editor) {
      this.editor.commands.setContent(value ?? '');
    } else {
      this.pendingValue = value ?? '';
    }
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void             { this.onTouched = fn; }

  setDisabledState(disabled: boolean): void {
    this.editor?.setEditable(!disabled);
  }

  // ── Toolbar commands ─────────────────────────────────────────────────────

  toggleBold(): void        { this.editor?.chain().focus().toggleBold().run(); }
  toggleItalic(): void      { this.editor?.chain().focus().toggleItalic().run(); }
  toggleBulletList(): void  { this.editor?.chain().focus().toggleBulletList().run(); }
  toggleOrderedList(): void { this.editor?.chain().focus().toggleOrderedList().run(); }

  /**
   * Toggles a hyperlink on the current selection.
   * If the cursor is already inside a link, the link is removed.
   * Otherwise, the user is prompted for the URL.
   */
  toggleLink(): void {
    if (!this.editor) return;
    if (this.editor.isActive('link')) {
      this.editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('URL du lien');
    if (url?.trim()) {
      this.editor.chain().focus().setLink({ href: url.trim() }).run();
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private syncToolbar(editor: Editor): void {
    this.isBold.set(editor.isActive('bold'));
    this.isItalic.set(editor.isActive('italic'));
    this.isBulletList.set(editor.isActive('bulletList'));
    this.isOrderedList.set(editor.isActive('orderedList'));
    this.isLink.set(editor.isActive('link'));
  }
}
