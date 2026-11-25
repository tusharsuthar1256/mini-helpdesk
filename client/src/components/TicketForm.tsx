import { useEffect, useState } from "react";
import { RiTicket2Line } from "@remixicon/react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Input } from "@/components/base/input/input";
import { Textarea } from "@/components/base/textarea/textarea";
import { Select, SelectItem } from "@/components/base/select/select";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import api, { getError } from "@/api/api";
import { categoryLabels, priorityLabels } from "@/utils/helpers";

const TicketForm = ({ isOpen, setIsOpen, ticket, onSaved }: any) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(ticket ? ticket.title : "");
      setDescription(ticket ? ticket.description : "");
      setCategory(ticket ? ticket.category : "general");
      setPriority(ticket ? ticket.priority : "medium");
    }
  }, [isOpen]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (title.trim().length < 5) {
      toast.error("Title must be at least 5 characters");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    setSaving(true);
    try {
      const data = { title, description, category, priority };
      let res;
      if (ticket) {
        res = await api.patch("/tickets/" + ticket.id, data);
        toast.success("Ticket updated");
      } else {
        res = await api.post("/tickets", data);
        toast.success("Ticket created");
      }
      setIsOpen(false);
      onSaved(res.data.data);
    } catch (error) {
      toast.error(getError(error));
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <ModalHeader
          icon={RiTicket2Line}
          title={ticket ? "Edit ticket" : "New ticket"}
          description="Tell us what is wrong and we will get back to you."
        />
        <ModalBody className="flex flex-col gap-4">
          <Input
            label="Title"
            placeholder="Short summary of the problem"
            value={title}
            onChange={setTitle}
            isRequired
          />
          <Textarea
            label="Description"
            placeholder="What happened?"
            value={description}
            onChange={setDescription}
            rows={5}
            maxLength={5000}
            isRequired
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              selectedKey={category}
              onSelectionChange={(key: any) => setCategory(key)}
              className="w-full"
              triggerClassName="w-full"
            >
              {Object.keys(categoryLabels).map((key) => (
                <SelectItem key={key} id={key} textValue={categoryLabels[key]}>
                  {categoryLabels[key]}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Priority"
              selectedKey={priority}
              onSelectionChange={(key: any) => setPriority(key)}
              className="w-full"
              triggerClassName="w-full"
            >
              {Object.keys(priorityLabels).map((key) => (
                <SelectItem key={key} id={key} textValue={priorityLabels[key]}>
                  {priorityLabels[key]}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default TicketForm;
